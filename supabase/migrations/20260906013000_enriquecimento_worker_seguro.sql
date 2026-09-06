begin;

-- Credencial dedicada: apenas seu hash fica no banco. O valor é configurado
-- separadamente no runtime da Edge, nunca no browser ou no histórico do job.
create table private.crm_worker_credencial (
  id boolean primary key default true check (id),
  hash bytea not null check (octet_length(hash) = 32)
);
revoke all on private.crm_worker_credencial from public, anon, authenticated;

create function private.crm_validar_worker(p_chave text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or p_chave is null or length(p_chave) < 64
    or not exists (
      select 1 from private.crm_worker_credencial
      where hash = extensions.digest(p_chave, 'sha256')
    ) then
    raise exception 'worker_nao_autorizado' using errcode = '42501';
  end if;
end;
$$;
revoke all on function private.crm_validar_worker(text) from public, anon, authenticated;

-- A prova é verificada ANTES de reservar créditos. A RPC existente conserva
-- as verificações de plano atual, dono, saldo e limite de trabalhos simultâneos.
create function public.crm_worker_iniciar(p_oportunidade uuid, p_chave text)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  perform private.crm_validar_worker(p_chave);
  return public.crm_iniciar_enriquecimento(p_oportunidade);
end;
$$;
revoke all on function public.crm_worker_iniciar(uuid, text) from public, anon;
grant execute on function public.crm_worker_iniciar(uuid, text) to authenticated;
revoke execute on function public.crm_iniciar_enriquecimento(uuid) from public, anon, authenticated;

alter table public.crm_enriquecimentos add column etapa text
  check (etapa in ('ler_contexto', 'ler_site', 'gerar_dossie'));

-- Cada escrita tem dono, prova e transição explícita. O lock serializa a
-- conclusão com falhas/watchdog. Um terminal não pode ser reaberto por retry.
create function public.crm_worker_avancar(
  p_id uuid, p_chave text, p_etapa text,
  p_resultado jsonb default null, p_fontes jsonb default '[]',
  p_modelo text default null, p_erro text default null
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_linha public.crm_enriquecimentos;
begin
  perform private.crm_validar_worker(p_chave);
  select * into v_linha from public.crm_enriquecimentos
  where id = p_id and dono = (select auth.uid()) for update;
  if not found then
    raise exception 'execucao_nao_encontrada' using errcode = '42501';
  end if;
  if p_etapa is null or p_etapa not in
    ('ler_contexto', 'ler_site', 'gerar_dossie', 'concluido', 'falhou') then
    raise exception 'etapa_invalida' using errcode = '22023';
  end if;
  if v_linha.status in ('concluido', 'falhou') then return false; end if;
  if p_etapa = 'ler_contexto' and v_linha.status <> 'na_fila' then return false; end if;
  if p_etapa = 'ler_site' and
    (v_linha.status <> 'processando' or v_linha.etapa is distinct from 'ler_contexto') then return false; end if;
  if p_etapa = 'gerar_dossie' and
    (v_linha.status <> 'processando' or v_linha.etapa is distinct from 'ler_site') then return false; end if;
  if p_etapa = 'concluido' and
    (v_linha.status <> 'processando' or v_linha.etapa is distinct from 'gerar_dossie') then return false; end if;
  if p_etapa = 'concluido' and (p_resultado is null or jsonb_typeof(p_resultado) <> 'object') then
    raise exception 'resultado_necessario' using errcode = '22023';
  end if;

  update public.crm_enriquecimentos set
    status = case p_etapa when 'concluido' then 'concluido'::public.crm_enriquecimento_status
      when 'falhou' then 'falhou'::public.crm_enriquecimento_status
      else 'processando'::public.crm_enriquecimento_status end,
    etapa = case when p_etapa in ('concluido','falhou') then etapa else p_etapa end,
    iniciado_em = coalesce(iniciado_em, now()),
    concluido_em = case when p_etapa in ('concluido','falhou') then now() else null end,
    resultado = case when p_etapa = 'concluido' then p_resultado else resultado end,
    fontes = case when p_etapa = 'concluido' then p_fontes else fontes end,
    modelo = case when p_etapa = 'concluido' then left(p_modelo, 120) else modelo end,
    erro = case when p_etapa = 'falhou' then
      left(coalesce(p_erro, 'Não foi possível concluir a análise.'), 3000) else null end
  where id = v_linha.id;
  return true;
end;
$$;
revoke all on function public.crm_worker_avancar(uuid, text, text, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.crm_worker_avancar(uuid, text, text, jsonb, jsonb, text, text) to authenticated;
revoke update on public.crm_enriquecimentos from authenticated;
drop policy if exists crm_enriquecimentos_update on public.crm_enriquecimentos;

-- Estorna somente um débito real de uma execução ativa. Não cria créditos
-- para históricos anteriores à cobrança ou para um resultado já entregue.
create or replace function private.crm_estornar_enriquecimento_falho()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_custo integer;
  v_saldo integer;
begin
  if old.status not in ('na_fila','processando') then return new; end if;
  select -movimento into v_custo from public.prospeccao_movimentos
  where dono = new.dono and enriquecimento_id = new.id and tipo = 'enriquecimento';
  if v_custo is null or v_custo <= 0 or exists (
    select 1 from public.prospeccao_movimentos
    where dono = new.dono and enriquecimento_id = new.id and tipo = 'estorno_enriquecimento'
  ) then return new; end if;
  update public.prospeccao_carteiras set saldo = saldo + v_custo
  where dono = new.dono returning saldo into v_saldo;
  if v_saldo is not null then
    insert into public.prospeccao_movimentos
      (dono,enriquecimento_id,tipo,movimento,saldo_apos,descricao)
    values (new.dono,new.id,'estorno_enriquecimento',v_custo,v_saldo,
      'Estorno de enriquecimento nao concluido');
  end if;
  return new;
end;
$$;

commit;

begin;

alter table public.projetos_execucao
  add column tipo_servico text not null default 'pontual'
    check (tipo_servico in ('pontual', 'recorrente')),
  add column encerramento_manual_em timestamptz,
  add column recorrencia_encerrada_em timestamptz,
  add constraint projetos_gestao_encerramento_coerente check (
    (encerramento_manual_em is null or status = 'concluido') and
    (recorrencia_encerrada_em is null or (tipo_servico = 'recorrente' and status = 'concluido'))
  );

comment on column public.projetos_execucao.encerramento_manual_em is
  'Entrega declarada pelo profissional. Não confirma tarefas, aceite do cliente ou garantia.';
comment on column public.projetos_execucao.recorrencia_encerrada_em is
  'Fim explícito do acompanhamento recorrente; não representa cancelamento de cobrança.';

-- Respeita a conclusão manual ao editar registros antigos. Um ajuste solicitado
-- pelo cliente ainda pode reabrir a execução pelo fluxo já existente.
create function private.projeto_gestao_normalizar()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status <> 'concluido' then
    new.encerramento_manual_em := null;
    new.recorrencia_encerrada_em := null;
  end if;
  if new.tipo_servico <> 'recorrente' then new.recorrencia_encerrada_em := null; end if;
  return new;
end;
$$;
revoke execute on function private.projeto_gestao_normalizar() from public, anon, authenticated;
create trigger projetos_gestao_normalizar before update on public.projetos_execucao
  for each row execute function private.projeto_gestao_normalizar();

create or replace function private.projeto_sincronizar_progresso()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_total integer;
  v_concluidas integer;
  v_aceite_final public.projeto_cliente_status;
begin
  select count(*)::integer, count(*) filter (where status = 'concluida')::integer
  into v_total, v_concluidas from public.projeto_tarefas
  where projeto_execucao_id = new.projeto_execucao_id and dono = new.dono;

  select cliente_status into v_aceite_final from public.projeto_tarefas
  where projeto_execucao_id = new.projeto_execucao_id and dono = new.dono
  order by ordem desc, id desc limit 1;

  update public.projetos_execucao
  set status = case
    when v_total > 0 and v_concluidas = v_total and v_aceite_final = 'aprovada'
      then 'concluido'::public.projeto_execucao_status
    when v_total > 0 and v_concluidas = v_total then 'em_validacao'::public.projeto_execucao_status
    when status in ('planejamento', 'em_validacao', 'concluido') then 'em_execucao'::public.projeto_execucao_status
    else status end,
    concluido_em = case
      when v_total > 0 and v_concluidas = v_total and v_aceite_final = 'aprovada'
        then coalesce(concluido_em, now()) else null end
  where id = new.projeto_execucao_id and dono = new.dono
    and encerramento_manual_em is null;
  return new;
end;
$$;

create function public.projeto_gerenciar_entrega(
  p_projeto_id uuid, p_acao text, p_atualizado_em timestamptz,
  p_confirmar_pendencias boolean default false
)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_dono uuid := (select auth.uid());
  v_projeto public.projetos_execucao%rowtype;
  v_titulo text;
begin
  if v_dono is null then raise exception 'autenticacao_necessaria' using errcode = '28000'; end if;
  if p_acao is null or p_acao not in ('pontual', 'recorrente', 'concluir', 'reabrir', 'encerrar_recorrencia', 'retomar_recorrencia')
    or p_atualizado_em is null then
    raise exception 'acao_invalida' using errcode = '22023';
  end if;
  select * into v_projeto from public.projetos_execucao
  where id = p_projeto_id and dono = v_dono for update;
  if not found then raise exception 'projeto_indisponivel' using errcode = 'P0002'; end if;

  -- Repetir a mesma intenção não muda datas nem duplica o histórico.
  if (p_acao in ('pontual', 'recorrente') and v_projeto.tipo_servico = p_acao)
    or (p_acao = 'concluir' and v_projeto.status = 'concluido')
    or (p_acao = 'reabrir' and v_projeto.status <> 'concluido')
    or (p_acao = 'encerrar_recorrencia' and v_projeto.recorrencia_encerrada_em is not null)
    or (p_acao = 'retomar_recorrencia' and v_projeto.tipo_servico = 'recorrente' and v_projeto.recorrencia_encerrada_em is null)
    then return true; end if;
  if v_projeto.atualizado_em is distinct from p_atualizado_em then
    raise exception 'projeto_alterado' using errcode = '40001';
  end if;

  if p_acao in ('pontual', 'recorrente') then
    update public.projetos_execucao set tipo_servico = p_acao where id = p_projeto_id and dono = v_dono;
    v_titulo := case p_acao when 'pontual' then 'Projeto definido como pontual' else 'Projeto definido como recorrente' end;
  elsif p_acao = 'concluir' then
    if not coalesce(p_confirmar_pendencias, false) and (
      exists (select 1 from public.projeto_tarefas where projeto_execucao_id = p_projeto_id and dono = v_dono
        and (status <> 'concluida' or cliente_status in ('aguardando', 'ajustes')))
      or exists (select 1 from public.projeto_acoes where projeto_execucao_id = p_projeto_id and dono = v_dono and status = 'pendente')
    ) then raise exception 'pendencias_na_entrega' using errcode = '22023'; end if;
    update public.projetos_execucao set status = 'concluido', concluido_em = now(), encerramento_manual_em = now()
      where id = p_projeto_id and dono = v_dono;
    v_titulo := 'Entrega concluída pelo profissional';
  elsif p_acao = 'reabrir' then
    update public.projetos_execucao set status = 'em_execucao', concluido_em = null
      where id = p_projeto_id and dono = v_dono;
    v_titulo := 'Execução do projeto reaberta';
  else
    if v_projeto.tipo_servico <> 'recorrente' or v_projeto.status <> 'concluido' then
      raise exception 'recorrencia_indisponivel' using errcode = '22023';
    end if;
    if p_acao = 'encerrar_recorrencia' and not coalesce(p_confirmar_pendencias, false) and (
      exists (select 1 from public.projeto_tarefas where projeto_execucao_id = p_projeto_id and dono = v_dono
        and (status <> 'concluida' or cliente_status in ('aguardando', 'ajustes')))
      or exists (select 1 from public.projeto_acoes where projeto_execucao_id = p_projeto_id and dono = v_dono and status = 'pendente')
    ) then raise exception 'pendencias_na_entrega' using errcode = '22023'; end if;
    update public.projetos_execucao
      set recorrencia_encerrada_em = case when p_acao = 'encerrar_recorrencia' then now() else null end
      where id = p_projeto_id and dono = v_dono;
    v_titulo := case p_acao when 'encerrar_recorrencia' then 'Acompanhamento recorrente encerrado' else 'Acompanhamento recorrente retomado' end;
  end if;

  insert into public.crm_eventos (dono, empresa_id, oportunidade_id, tipo, titulo, descricao, dados, fonte, fonte_id)
  values (v_dono, v_projeto.empresa_id, v_projeto.oportunidade_id, 'projeto_gestao_alterada', v_titulo,
    v_projeto.titulo, jsonb_build_object('projeto_execucao_id', p_projeto_id, 'acao', p_acao,
      'confirmou_pendencias', coalesce(p_confirmar_pendencias, false)), 'projetos', p_projeto_id::text);
  return true;
end;
$$;
revoke execute on function public.projeto_gerenciar_entrega(uuid, text, timestamptz, boolean) from public, anon;
grant execute on function public.projeto_gerenciar_entrega(uuid, text, timestamptz, boolean) to authenticated;

-- Reutiliza os compromissos do projeto; não cria outra agenda nem ciclos automáticos.
create function public.projeto_agendar_acompanhamento(
  p_projeto_id uuid, p_acao_id uuid, p_titulo text, p_prazo date
)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_dono uuid := (select auth.uid());
  v_projeto public.projetos_execucao%rowtype;
  v_prazo timestamptz := (p_prazo + time '12:00') at time zone 'America/Sao_Paulo';
begin
  if v_dono is null then raise exception 'autenticacao_necessaria' using errcode = '28000'; end if;
  if p_acao_id is null or p_titulo is null or char_length(btrim(p_titulo)) not between 3 and 500 or p_prazo is null then
    raise exception 'acao_invalida' using errcode = '22023';
  end if;
  select * into v_projeto from public.projetos_execucao
    where id = p_projeto_id and dono = v_dono for update;
  if not found then raise exception 'projeto_indisponivel' using errcode = 'P0002'; end if;
  if v_projeto.tipo_servico <> 'recorrente' or v_projeto.recorrencia_encerrada_em is not null then
    raise exception 'recorrencia_indisponivel' using errcode = '22023';
  end if;
  insert into public.projeto_acoes (id, dono, empresa_id, oportunidade_id, projeto_execucao_id,
    titulo, prazo_em, origem, categoria, responsavel_tipo, visivel_cliente)
  values (p_acao_id, v_dono, v_projeto.empresa_id, v_projeto.oportunidade_id, p_projeto_id,
    btrim(p_titulo), v_prazo, 'manual', 'compromisso', 'prestador', false)
  on conflict (id) do nothing;
  if not exists (select 1 from public.projeto_acoes where id = p_acao_id and dono = v_dono
    and projeto_execucao_id = p_projeto_id and titulo = btrim(p_titulo) and prazo_em = v_prazo) then
    raise exception 'acao_em_conflito' using errcode = '40001';
  end if;
  return true;
end;
$$;
revoke execute on function public.projeto_agendar_acompanhamento(uuid, uuid, text, date) from public, anon;
grant execute on function public.projeto_agendar_acompanhamento(uuid, uuid, text, date) to authenticated;

commit;

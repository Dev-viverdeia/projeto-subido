-- =============================================================================
-- ENCERRAMENTO E POS-ENTREGA
--
-- O aceite da ultima entrega passa a confirmar tambem um termo simples de
-- encerramento: resultado registrado, garantia, suporte e continuidade. O
-- projeto so fecha depois que o cliente recebe esse contexto no portal.
-- =============================================================================

begin;

create type public.projeto_encerramento_status as enum (
  'rascunho',
  'aguardando_aceite',
  'encerrado'
);

create table public.projeto_encerramentos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  projeto_execucao_id uuid not null,
  status public.projeto_encerramento_status not null default 'rascunho',
  resumo_entrega text not null,
  resultado_principal text not null,
  evidencia_resultado_url text,
  garantia_dias integer not null default 30,
  garantia_cobre text not null,
  garantia_nao_cobre text not null,
  canal_suporte text not null,
  responsavel_continuidade text not null,
  orientacao_continuidade text not null,
  enviado_em timestamptz,
  aceito_em timestamptz,
  garantia_termina_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint projeto_encerramentos_projeto_fk
    foreign key (dono, projeto_execucao_id)
    references public.projetos_execucao (dono, id)
    on delete cascade,
  constraint projeto_encerramentos_resumo_tamanho
    check (char_length(btrim(resumo_entrega)) between 10 and 4000),
  constraint projeto_encerramentos_resultado_tamanho
    check (char_length(btrim(resultado_principal)) between 10 and 4000),
  constraint projeto_encerramentos_evidencia_url_valida
    check (
      evidencia_resultado_url is null
      or (
        char_length(evidencia_resultado_url) <= 2048
        and evidencia_resultado_url ~* '^https?://[^[:space:]]+$'
      )
    ),
  constraint projeto_encerramentos_garantia_dias_valida
    check (garantia_dias between 0 and 180),
  constraint projeto_encerramentos_garantia_cobre_tamanho
    check (char_length(btrim(garantia_cobre)) between 5 and 3000),
  constraint projeto_encerramentos_garantia_nao_cobre_tamanho
    check (char_length(btrim(garantia_nao_cobre)) between 5 and 3000),
  constraint projeto_encerramentos_canal_suporte_tamanho
    check (char_length(btrim(canal_suporte)) between 3 and 500),
  constraint projeto_encerramentos_responsavel_tamanho
    check (char_length(btrim(responsavel_continuidade)) between 2 and 300),
  constraint projeto_encerramentos_orientacao_tamanho
    check (char_length(btrim(orientacao_continuidade)) between 10 and 4000),
  constraint projeto_encerramentos_datas_estado
    check (
      (status = 'rascunho' and aceito_em is null and garantia_termina_em is null)
      or (status = 'aguardando_aceite' and enviado_em is not null and aceito_em is null and garantia_termina_em is null)
      or (status = 'encerrado' and enviado_em is not null and aceito_em is not null and garantia_termina_em is not null)
    ),
  unique (projeto_execucao_id),
  unique (dono, id)
);

comment on table public.projeto_encerramentos is
  'Termo de encerramento apresentado junto do aceite final, com resultado, garantia, suporte e continuidade.';
comment on column public.projeto_encerramentos.resultado_principal is
  'Resultado factual registrado pelo prestador. Nao deve ser preenchido por inferencia da IA.';
comment on column public.projeto_encerramentos.garantia_termina_em is
  'Calculada somente no aceite final do cliente. Antes disso o prazo de garantia ainda nao corre.';

create index projeto_encerramentos_dono_status_idx
  on public.projeto_encerramentos (dono, status, atualizado_em desc);

create trigger projeto_encerramentos_atualizado_em
  before update on public.projeto_encerramentos
  for each row execute function private.tocar_atualizado_em();

alter table public.projeto_encerramentos enable row level security;

create policy projeto_encerramentos_select on public.projeto_encerramentos
  for select to authenticated
  using (dono = (select auth.uid()));

revoke all on table public.projeto_encerramentos from anon, authenticated;
grant select on table public.projeto_encerramentos to authenticated;

alter table public.projeto_portal_eventos
  drop constraint projeto_portal_eventos_tipo_valido,
  add constraint projeto_portal_eventos_tipo_valido
    check (tipo in (
      'portal_ativado',
      'portal_desativado',
      'link_rotacionado',
      'aprovacao_solicitada',
      'entrega_aprovada',
      'ajustes_solicitados',
      'arquivo_liberado',
      'arquivo_retirado',
      'pendencia_concluida',
      'mudanca_escopo_solicitada',
      'mudanca_escopo_incluida',
      'mudanca_escopo_proposta',
      'mudanca_escopo_aprovada',
      'mudanca_escopo_recusada',
      'encerramento_enviado',
      'projeto_encerrado'
    ));

create function private.projeto_encerramento_registrar_evento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'aguardando_aceite' then
    insert into public.projeto_portal_eventos (
      dono, projeto_execucao_id, tipo, autor
    ) values (
      new.dono, new.projeto_execucao_id, 'encerramento_enviado', 'prestador'
    );
  elsif new.status = 'encerrado' then
    insert into public.projeto_portal_eventos (
      dono, projeto_execucao_id, tipo, autor, comentario
    ) values (
      new.dono,
      new.projeto_execucao_id,
      'projeto_encerrado',
      'cliente',
      case
        when new.garantia_dias = 0 then 'Aceite final registrado sem garantia adicional.'
        else format('Garantia de %s dias iniciada.', new.garantia_dias)
      end
    );
  end if;

  return new;
end;
$$;

revoke execute on function private.projeto_encerramento_registrar_evento()
  from public, anon, authenticated;

create trigger projeto_encerramentos_registrar_evento
  after update of status on public.projeto_encerramentos
  for each row execute function private.projeto_encerramento_registrar_evento();

create function public.projeto_encerramento_salvar(
  p_projeto_id uuid,
  p_resumo_entrega text,
  p_resultado_principal text,
  p_evidencia_resultado_url text,
  p_garantia_dias integer,
  p_garantia_cobre text,
  p_garantia_nao_cobre text,
  p_canal_suporte text,
  p_responsavel_continuidade text,
  p_orientacao_continuidade text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_encerramento_id uuid;
begin
  if v_dono is null then
    raise exception 'sessao_obrigatoria';
  end if;

  if not exists (
    select 1
    from public.projetos_execucao projeto
    where projeto.id = p_projeto_id
      and projeto.dono = v_dono
      and projeto.status <> 'concluido'
  ) then
    raise exception 'projeto_indisponivel';
  end if;

  insert into public.projeto_encerramentos (
    dono,
    projeto_execucao_id,
    status,
    resumo_entrega,
    resultado_principal,
    evidencia_resultado_url,
    garantia_dias,
    garantia_cobre,
    garantia_nao_cobre,
    canal_suporte,
    responsavel_continuidade,
    orientacao_continuidade
  ) values (
    v_dono,
    p_projeto_id,
    'rascunho',
    btrim(p_resumo_entrega),
    btrim(p_resultado_principal),
    nullif(btrim(coalesce(p_evidencia_resultado_url, '')), ''),
    p_garantia_dias,
    btrim(p_garantia_cobre),
    btrim(p_garantia_nao_cobre),
    btrim(p_canal_suporte),
    btrim(p_responsavel_continuidade),
    btrim(p_orientacao_continuidade)
  )
  on conflict (projeto_execucao_id) do update
  set
    resumo_entrega = excluded.resumo_entrega,
    resultado_principal = excluded.resultado_principal,
    evidencia_resultado_url = excluded.evidencia_resultado_url,
    garantia_dias = excluded.garantia_dias,
    garantia_cobre = excluded.garantia_cobre,
    garantia_nao_cobre = excluded.garantia_nao_cobre,
    canal_suporte = excluded.canal_suporte,
    responsavel_continuidade = excluded.responsavel_continuidade,
    orientacao_continuidade = excluded.orientacao_continuidade
  where public.projeto_encerramentos.dono = v_dono
    and public.projeto_encerramentos.status = 'rascunho'
  returning id into v_encerramento_id;

  if v_encerramento_id is null then
    raise exception 'encerramento_nao_editavel';
  end if;

  return v_encerramento_id;
end;
$$;

revoke execute on function public.projeto_encerramento_salvar(
  uuid, text, text, text, integer, text, text, text, text, text
) from public, anon;
grant execute on function public.projeto_encerramento_salvar(
  uuid, text, text, text, integer, text, text, text, text, text
) to authenticated;

create function public.projeto_encerramento_enviar(
  p_projeto_id uuid,
  p_tarefa_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_encerramento_id uuid;
begin
  if v_dono is null then
    raise exception 'sessao_obrigatoria';
  end if;

  if not exists (
    select 1
    from public.projetos_execucao projeto
    where projeto.id = p_projeto_id
      and projeto.dono = v_dono
      and projeto.portal_ativo
      and projeto.status <> 'concluido'
  ) then
    raise exception 'projeto_indisponivel';
  end if;

  if p_tarefa_id is distinct from (
    select tarefa.id
    from public.projeto_tarefas tarefa
    where tarefa.projeto_execucao_id = p_projeto_id
      and tarefa.dono = v_dono
    order by tarefa.ordem desc, tarefa.id desc
    limit 1
  ) then
    raise exception 'tarefa_final_invalida';
  end if;

  if exists (
    select 1
    from public.projeto_tarefas tarefa
    where tarefa.projeto_execucao_id = p_projeto_id
      and tarefa.dono = v_dono
      and tarefa.status <> 'concluida'
  ) then
    raise exception 'tarefas_pendentes';
  end if;

  update public.projeto_encerramentos encerramento
  set
    status = 'aguardando_aceite',
    enviado_em = now(),
    aceito_em = null,
    garantia_termina_em = null
  where encerramento.projeto_execucao_id = p_projeto_id
    and encerramento.dono = v_dono
    and encerramento.status = 'rascunho'
  returning encerramento.id into v_encerramento_id;

  if v_encerramento_id is null then
    raise exception 'encerramento_precisa_ser_preparado';
  end if;

  update public.projeto_tarefas tarefa
  set cliente_status = 'aguardando'
  where tarefa.id = p_tarefa_id
    and tarefa.projeto_execucao_id = p_projeto_id
    and tarefa.dono = v_dono
    and tarefa.status = 'concluida'
    and tarefa.cliente_status in ('nao_solicitada', 'ajustes');

  if not found then
    raise exception 'entrega_final_indisponivel';
  end if;

  return true;
end;
$$;

revoke execute on function public.projeto_encerramento_enviar(uuid, uuid) from public, anon;
grant execute on function public.projeto_encerramento_enviar(uuid, uuid) to authenticated;

-- Preserva projetos que ja estavam aguardando ou ja tinham aceite antes desta
-- jornada existir. Novos encerramentos sempre passam pelo formulario completo.
insert into public.projeto_encerramentos (
  dono,
  projeto_execucao_id,
  status,
  resumo_entrega,
  resultado_principal,
  garantia_dias,
  garantia_cobre,
  garantia_nao_cobre,
  canal_suporte,
  responsavel_continuidade,
  orientacao_continuidade,
  enviado_em,
  aceito_em,
  garantia_termina_em
)
select
  projeto.dono,
  projeto.id,
  case
    when projeto.status = 'concluido' then 'encerrado'::public.projeto_encerramento_status
    else 'aguardando_aceite'::public.projeto_encerramento_status
  end,
  coalesce(nullif(btrim(projeto.documento -> 'projeto' ->> 'resumo'), ''), 'Entrega realizada conforme o escopo aprovado pelo cliente.'),
  'Escopo executado, materiais entregues e validação solicitada ao cliente.',
  0,
  'Nenhuma garantia adicional foi registrada neste projeto anterior.',
  'Novas funcionalidades e mudanças de escopo não estão incluídas.',
  'Fale diretamente com o responsável pelo projeto.',
  coalesce(nullif(btrim(projeto.documento -> 'cliente' ->> 'contato'), ''), 'Responsável indicado pelo cliente'),
  'Consulte os materiais finais e o histórico registrado neste portal.',
  coalesce(ultima.cliente_solicitado_em, projeto.concluido_em, now()),
  case when projeto.status = 'concluido' then coalesce(projeto.concluido_em, ultima.cliente_respondido_em, now()) else null end,
  case when projeto.status = 'concluido' then coalesce(projeto.concluido_em, ultima.cliente_respondido_em, now()) else null end
from public.projetos_execucao projeto
join lateral (
  select tarefa.cliente_status, tarefa.cliente_solicitado_em, tarefa.cliente_respondido_em
  from public.projeto_tarefas tarefa
  where tarefa.projeto_execucao_id = projeto.id
  order by tarefa.ordem desc, tarefa.id desc
  limit 1
) ultima on true
where projeto.status = 'concluido'
   or ultima.cliente_status = 'aguardando';

create or replace function public.projeto_portal_decidir(
  p_codigo uuid,
  p_tarefa_id uuid,
  p_decisao public.projeto_cliente_status,
  p_comentario text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_atualizada uuid;
  v_projeto_id uuid;
  v_tarefa_final boolean;
begin
  if p_decisao not in ('aprovada', 'ajustes') then
    raise exception 'decisao_invalida';
  end if;

  update public.projeto_tarefas tarefa
  set
    cliente_status = p_decisao,
    cliente_comentario = nullif(btrim(coalesce(p_comentario, '')), '')
  from public.projetos_execucao projeto
  where tarefa.id = p_tarefa_id
    and tarefa.projeto_execucao_id = projeto.id
    and projeto.portal_codigo = p_codigo
    and projeto.portal_ativo
    and tarefa.cliente_status = 'aguardando'
  returning tarefa.id, tarefa.projeto_execucao_id
  into v_atualizada, v_projeto_id;

  if v_atualizada is null then
    return false;
  end if;

  select p_tarefa_id = ultima.id
  into v_tarefa_final
  from public.projeto_tarefas ultima
  where ultima.projeto_execucao_id = v_projeto_id
  order by ultima.ordem desc, ultima.id desc
  limit 1;

  if v_tarefa_final and p_decisao = 'aprovada' then
    update public.projeto_encerramentos encerramento
    set
      status = 'encerrado',
      aceito_em = now(),
      garantia_termina_em = now() + make_interval(days => encerramento.garantia_dias)
    where encerramento.projeto_execucao_id = v_projeto_id
      and encerramento.status = 'aguardando_aceite';

    if not found then
      raise exception 'encerramento_nao_enviado';
    end if;

    update public.projetos_execucao projeto
    set
      status = 'concluido',
      concluido_em = coalesce(projeto.concluido_em, now())
    where projeto.id = v_projeto_id
      and not exists (
        select 1
        from public.projeto_tarefas pendente
        where pendente.projeto_execucao_id = projeto.id
          and pendente.status <> 'concluida'
      );
  elsif v_tarefa_final and p_decisao = 'ajustes' then
    update public.projeto_encerramentos encerramento
    set
      status = 'rascunho',
      enviado_em = null,
      aceito_em = null,
      garantia_termina_em = null
    where encerramento.projeto_execucao_id = v_projeto_id
      and encerramento.status = 'aguardando_aceite';

    update public.projetos_execucao
    set status = 'em_execucao', concluido_em = null
    where id = v_projeto_id;
  end if;

  return true;
end;
$$;

revoke execute on function public.projeto_portal_decidir(uuid, uuid, public.projeto_cliente_status, text)
  from public, anon, authenticated;
grant execute on function public.projeto_portal_decidir(uuid, uuid, public.projeto_cliente_status, text)
  to service_role;

commit;

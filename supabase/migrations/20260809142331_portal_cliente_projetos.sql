-- =============================================================================
-- PORTAL DO CLIENTE
--
-- O link público é um segredo de alta entropia, resolvido somente no servidor.
-- Nenhuma tabela ganha acesso anônimo: o navegador nunca consulta o banco com a
-- chave pública para enxergar projetos, tarefas ou evidências internas.
-- =============================================================================

begin;

create type public.projeto_cliente_status as enum (
  'nao_solicitada',
  'aguardando',
  'aprovada',
  'ajustes'
);

alter table public.projetos_execucao
  add column portal_ativo boolean not null default false,
  add column portal_codigo uuid not null default gen_random_uuid(),
  add column portal_ativado_em timestamptz;

alter table public.projetos_execucao
  add constraint projetos_execucao_portal_codigo_unico unique (portal_codigo);

comment on column public.projetos_execucao.portal_codigo is
  'Segredo do link do cliente. Só é resolvido por código server-only com service role.';

alter table public.projeto_tarefas
  add column cliente_status public.projeto_cliente_status not null default 'nao_solicitada',
  add column cliente_nota text,
  add column entregavel_url text,
  add column cliente_solicitado_em timestamptz,
  add column cliente_respondido_em timestamptz,
  add column cliente_comentario text;

alter table public.projeto_tarefas
  add constraint projeto_tarefas_cliente_nota_tamanho
    check (cliente_nota is null or char_length(cliente_nota) <= 4000),
  add constraint projeto_tarefas_entregavel_url_valida
    check (
      entregavel_url is null
      or (
        char_length(entregavel_url) <= 2048
        and entregavel_url ~* '^https?://[^[:space:]]+$'
      )
    ),
  add constraint projeto_tarefas_cliente_comentario_tamanho
    check (cliente_comentario is null or char_length(cliente_comentario) <= 2000);

comment on column public.projeto_tarefas.cliente_nota is
  'Texto deliberadamente preparado para o cliente. Evidencia continua privada.';
comment on column public.projeto_tarefas.entregavel_url is
  'Link compartilhável informado pelo profissional; nunca deriva automaticamente da evidencia interna.';

create table public.projeto_portal_eventos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  projeto_execucao_id uuid not null references public.projetos_execucao (id) on delete cascade,
  tarefa_id uuid references public.projeto_tarefas (id) on delete set null,
  tipo text not null,
  autor text not null,
  comentario text,
  criado_em timestamptz not null default now(),

  constraint projeto_portal_eventos_tipo_valido
    check (tipo in (
      'portal_ativado',
      'portal_desativado',
      'link_rotacionado',
      'aprovacao_solicitada',
      'entrega_aprovada',
      'ajustes_solicitados'
    )),
  constraint projeto_portal_eventos_autor_valido
    check (autor in ('prestador', 'cliente')),
  constraint projeto_portal_eventos_comentario_tamanho
    check (comentario is null or char_length(comentario) <= 2000)
);

create index projeto_portal_eventos_projeto_idx
  on public.projeto_portal_eventos (dono, projeto_execucao_id, criado_em desc);

alter table public.projeto_portal_eventos enable row level security;

create policy projeto_portal_eventos_select on public.projeto_portal_eventos
  for select to authenticated
  using (dono = (select auth.uid()));

revoke all on table public.projeto_portal_eventos from anon;
revoke all on table public.projeto_portal_eventos from authenticated;
grant select on table public.projeto_portal_eventos to authenticated;

create function private.projeto_portal_validar_entrega()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_portal_ativo boolean;
begin
  new.cliente_nota := nullif(btrim(coalesce(new.cliente_nota, '')), '');
  new.entregavel_url := nullif(btrim(coalesce(new.entregavel_url, '')), '');
  new.cliente_comentario := nullif(btrim(coalesce(new.cliente_comentario, '')), '');

  if new.cliente_status is distinct from old.cliente_status then
    if new.cliente_status = 'aguardando' then
      select portal_ativo
        into v_portal_ativo
      from public.projetos_execucao
      where id = new.projeto_execucao_id
        and dono = new.dono;

      if new.status <> 'concluida' then
        raise exception 'tarefa_precisa_estar_concluida';
      end if;
      if not coalesce(v_portal_ativo, false) then
        raise exception 'portal_precisa_estar_ativo';
      end if;

      new.cliente_solicitado_em := now();
      new.cliente_respondido_em := null;
      new.cliente_comentario := null;
    elsif new.cliente_status in ('aprovada', 'ajustes') then
      if current_user <> 'service_role' then
        raise exception 'decisao_reservada_ao_portal';
      end if;
      if old.cliente_status <> 'aguardando' then
        raise exception 'entrega_nao_aguarda_decisao';
      end if;
      if new.cliente_status = 'ajustes' and new.cliente_comentario is null then
        raise exception 'comentario_de_ajuste_obrigatorio';
      end if;

      new.cliente_respondido_em := now();
      if new.cliente_status = 'ajustes' then
        new.status := 'em_andamento';
        new.concluida_em := null;
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function private.projeto_portal_validar_entrega() from public, anon, authenticated;

create trigger projeto_tarefas_validar_entrega_cliente
  before update of cliente_status, cliente_nota, entregavel_url, cliente_comentario
  on public.projeto_tarefas
  for each row execute function private.projeto_portal_validar_entrega();

create function private.projeto_portal_registrar_projeto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.portal_ativo is distinct from old.portal_ativo then
    insert into public.projeto_portal_eventos (
      dono, projeto_execucao_id, tipo, autor
    ) values (
      new.dono,
      new.id,
      case when new.portal_ativo then 'portal_ativado' else 'portal_desativado' end,
      'prestador'
    );
  elsif new.portal_codigo is distinct from old.portal_codigo then
    insert into public.projeto_portal_eventos (
      dono, projeto_execucao_id, tipo, autor
    ) values (
      new.dono, new.id, 'link_rotacionado', 'prestador'
    );
  end if;

  return new;
end;
$$;

revoke execute on function private.projeto_portal_registrar_projeto() from public, anon, authenticated;

create trigger projetos_execucao_registrar_portal
  after update of portal_ativo, portal_codigo on public.projetos_execucao
  for each row execute function private.projeto_portal_registrar_projeto();

create function private.projeto_portal_registrar_tarefa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tipo text;
  v_autor text := case
    when current_setting('request.jwt.claim.role', true) = 'service_role' then 'cliente'
    else 'prestador'
  end;
begin
  if new.cliente_status is not distinct from old.cliente_status then
    return new;
  end if;

  v_tipo := case new.cliente_status
    when 'aguardando' then 'aprovacao_solicitada'
    when 'aprovada' then 'entrega_aprovada'
    when 'ajustes' then 'ajustes_solicitados'
    else null
  end;

  if v_tipo is not null then
    insert into public.projeto_portal_eventos (
      dono, projeto_execucao_id, tarefa_id, tipo, autor, comentario
    ) values (
      new.dono,
      new.projeto_execucao_id,
      new.id,
      v_tipo,
      v_autor,
      case when new.cliente_status = 'ajustes' then new.cliente_comentario else null end
    );
  end if;

  return new;
end;
$$;

revoke execute on function private.projeto_portal_registrar_tarefa() from public, anon, authenticated;

create trigger projeto_tarefas_registrar_evento_cliente
  after update of cliente_status on public.projeto_tarefas
  for each row execute function private.projeto_portal_registrar_tarefa();

-- O service role chama esta RPC somente depois que a Server Action validou o
-- código do portal. Ela permanece fora do alcance de anon/authenticated.
create function public.projeto_portal_decidir(
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
  returning tarefa.id into v_atualizada;

  return v_atualizada is not null;
end;
$$;

revoke execute on function public.projeto_portal_decidir(uuid, uuid, public.projeto_cliente_status, text)
  from public, anon, authenticated;
grant execute on function public.projeto_portal_decidir(uuid, uuid, public.projeto_cliente_status, text)
  to service_role;

commit;

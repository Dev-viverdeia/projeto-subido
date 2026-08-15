-- =============================================================================
-- PORTAL PUBLICO DA PROPOSTA
--
-- O cliente recebe um link secreto de alta entropia, visualiza exatamente a
-- versao apresentada e registra a decisao sem criar conta. O navegador nunca
-- consulta as tabelas diretamente: leitura e mutacoes passam pelo servidor com
-- funcoes restritas ao service_role.
-- =============================================================================

begin;

alter table public.propostas
  add column compartilhamento_codigo uuid,
  add column compartilhamento_ativo boolean not null default false,
  add column compartilhada_em timestamptz,
  add column primeira_visualizacao_em timestamptz,
  add column ultima_visualizacao_em timestamptz,
  add column visualizacoes integer not null default 0,
  add column decisao_nome text,
  add column decisao_email text,
  add column decisao_comentario text,
  add column decidida_em timestamptz;

alter table public.propostas
  add constraint propostas_compartilhamento_codigo_unico unique (compartilhamento_codigo),
  add constraint propostas_visualizacoes_nao_negativas check (visualizacoes >= 0),
  add constraint propostas_decisao_nome_tamanho
    check (decisao_nome is null or char_length(decisao_nome) between 2 and 120),
  add constraint propostas_decisao_email_tamanho
    check (decisao_email is null or char_length(decisao_email) between 3 and 254),
  add constraint propostas_decisao_comentario_tamanho
    check (decisao_comentario is null or char_length(decisao_comentario) <= 2000);

create index propostas_compartilhamento_ativo_idx
  on public.propostas (compartilhamento_codigo)
  where compartilhamento_ativo;

comment on column public.propostas.compartilhamento_codigo is
  'Segredo rotacionado a cada apresentacao. So e resolvido por codigo server-only com service role.';
comment on column public.propostas.visualizacoes is
  'Quantidade de sessoes de visualizacao registradas pelo portal publico da proposta.';

-- Metadados do portal (visualizacao e decisao) nao criam uma nova versao do
-- documento. Titulo, conteudo e mudanca de estado continuam versionados.
create or replace function private.proposta_versionar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.titulo is distinct from old.titulo
    or new.documento is distinct from old.documento
    or new.status is distinct from old.status
  then
    new.versao := old.versao + 1;
  else
    new.versao := old.versao;
  end if;

  if new.documento is distinct from old.documento
    and old.status in ('apresentada', 'aceita', 'recusada')
  then
    new.status := 'rascunho';
  end if;

  if new.status is distinct from old.status then
    if new.status = 'apresentada' then
      new.apresentada_em := now();
    elsif new.status = 'aceita' then
      new.aceita_em := now();
    elsif new.status = 'recusada' then
      new.recusada_em := now();
    end if;
  end if;

  return new;
end;
$$;

create table public.proposta_portal_eventos (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  proposta_id uuid not null,
  tipo text not null,
  nome text,
  email text,
  comentario text,
  criado_em timestamptz not null default now(),

  constraint proposta_portal_eventos_proposta_fk
    foreign key (dono, proposta_id)
    references public.propostas (dono, id)
    on delete cascade,
  constraint proposta_portal_eventos_tipo_valido
    check (tipo in ('visualizada', 'aceita', 'recusada')),
  constraint proposta_portal_eventos_nome_tamanho
    check (nome is null or char_length(nome) between 2 and 120),
  constraint proposta_portal_eventos_email_tamanho
    check (email is null or char_length(email) between 3 and 254),
  constraint proposta_portal_eventos_comentario_tamanho
    check (comentario is null or char_length(comentario) <= 2000)
);

create index proposta_portal_eventos_proposta_idx
  on public.proposta_portal_eventos (dono, proposta_id, criado_em desc);

alter table public.proposta_portal_eventos enable row level security;

create policy proposta_portal_eventos_select on public.proposta_portal_eventos
  for select to authenticated
  using (dono = (select auth.uid()));

revoke all on table public.proposta_portal_eventos from anon, authenticated;
grant select on table public.proposta_portal_eventos to authenticated;

-- Roda depois de `propostas_versionar` pela ordem alfabetica dos triggers. Isso
-- tambem desativa um link quando editar uma proposta apresentada a reabre como
-- rascunho dentro daquele trigger anterior.
create function private.proposta_preparar_compartilhamento()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'apresentada' then
    new.compartilhamento_codigo := gen_random_uuid();
    new.compartilhamento_ativo := true;
    new.compartilhada_em := now();
    new.primeira_visualizacao_em := null;
    new.ultima_visualizacao_em := null;
    new.visualizacoes := 0;
    new.decisao_nome := null;
    new.decisao_email := null;
    new.decisao_comentario := null;
    new.decidida_em := null;
  elsif new.status in ('rascunho', 'pronta') then
    new.compartilhamento_ativo := false;
  end if;

  return new;
end;
$$;

revoke execute on function private.proposta_preparar_compartilhamento()
  from public, anon, authenticated;

create trigger propostas_zz_preparar_compartilhamento
  before update on public.propostas
  for each row execute function private.proposta_preparar_compartilhamento();

-- Propostas que ja estavam apresentadas antes desta entrega recebem um link sem
-- alterar versao, status ou fatos do CRM.
update public.propostas
set compartilhamento_codigo = gen_random_uuid(),
    compartilhamento_ativo = true,
    compartilhada_em = coalesce(apresentada_em, atualizado_em)
where status = 'apresentada';

-- Nucleo unico para iniciar a entrega. O wrapper autenticado e o aceite publico
-- chamam a mesma rotina, mantendo o comportamento idempotente por proposta.
create function private.projeto_criar_da_proposta(
  p_proposta_id uuid,
  p_dono uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposta public.propostas%rowtype;
  v_execucao_id uuid;
begin
  select * into v_proposta
  from public.propostas
  where id = p_proposta_id and dono = p_dono;

  if not found then
    raise exception 'proposta_nao_encontrada' using errcode = 'P0002';
  end if;

  if v_proposta.status <> 'aceita' then
    raise exception 'proposta_precisa_estar_aceita' using errcode = '22023';
  end if;

  insert into public.projetos_execucao (
    dono, proposta_id, empresa_id, oportunidade_id,
    projeto_id, builder_solucao_id, titulo, documento
  ) values (
    p_dono,
    v_proposta.id,
    v_proposta.empresa_id,
    v_proposta.oportunidade_id,
    v_proposta.projeto_id,
    v_proposta.builder_solucao_id,
    coalesce(nullif(v_proposta.documento #>> '{projeto,titulo}', ''), v_proposta.titulo),
    v_proposta.documento
  )
  on conflict (proposta_id) do nothing
  returning id into v_execucao_id;

  if v_execucao_id is null then
    select id into v_execucao_id
    from public.projetos_execucao
    where proposta_id = v_proposta.id and dono = p_dono;
    return v_execucao_id;
  end if;

  if v_proposta.projeto_id is not null then
    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      p_dono,
      v_execucao_id,
      fase.item ->> 'id',
      fase.item ->> 'titulo',
      (fase.item ->> 'id') || ':' || (passo.item ->> 'id'),
      passo.item ->> 'titulo',
      passo.item ->> 'acao',
      passo.item ->> 'concluidoQuando',
      passo.item ->> 'entregavel',
      ((fase.posicao - 1) * 1000 + passo.posicao)::integer
    from public.projeto_roteiros roteiro
    cross join lateral jsonb_array_elements(roteiro.roteiro -> 'fases')
      with ordinality as fase(item, posicao)
    cross join lateral jsonb_array_elements(fase.item -> 'passos')
      with ordinality as passo(item, posicao)
    where roteiro.solucao_id = v_proposta.projeto_id;
  end if;

  if not exists (
    select 1 from public.projeto_tarefas where projeto_execucao_id = v_execucao_id
  ) then
    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    ) values (
      p_dono, v_execucao_id, 'preparar', 'Preparar', 'confirmar-contexto',
      'Confirmar escopo, responsáveis e acessos',
      'Revise com o cliente o objetivo aprovado, nomeie os responsáveis e registre os acessos necessários antes de construir.',
      'Escopo, responsáveis, acessos e data de início estão confirmados.',
      'Checklist de kick-off aprovado.',
      1
    );

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      p_dono,
      v_execucao_id,
      'construir',
      'Construir',
      'escopo-' || item.posicao::text,
      item.valor ->> 'titulo',
      item.valor ->> 'descricao',
      'O item foi construído, testado pelo profissional e está pronto para validação do cliente.',
      item.valor ->> 'titulo',
      (1000 + item.posicao)::integer
    from jsonb_array_elements(v_proposta.documento -> 'escopo')
      with ordinality as item(valor, posicao);

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    ) values (
      p_dono, v_execucao_id, 'validar', 'Validar', 'validar-cliente',
      'Validar a operação com o cliente',
      'Conduza os testes com situações reais, registre ajustes e peça um aceite explícito antes da publicação final.',
      'O cliente concluiu os cenários combinados e aprovou os ajustes registrados.',
      'Aceite de validação do cliente.',
      2001
    );

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      p_dono,
      v_execucao_id,
      'entregar',
      'Entregar',
      'entregavel-' || item.posicao::text,
      'Entregar ' || (item.valor #>> '{}'),
      'Organize a versão final, registre onde ela está e apresente ao responsável pela operação.',
      'O cliente recebeu, sabe acessar e existe um responsável pela continuidade.',
      item.valor #>> '{}',
      (3000 + item.posicao)::integer
    from jsonb_array_elements(v_proposta.documento -> 'entregaveis')
      with ordinality as item(valor, posicao);
  end if;

  return v_execucao_id;
end;
$$;

revoke all on function private.projeto_criar_da_proposta(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.projeto_criar_da_proposta(uuid, uuid)
  to service_role;

create or replace function public.projeto_iniciar(p_proposta_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
begin
  if v_dono is null then
    raise exception 'autenticacao_necessaria' using errcode = '28000';
  end if;

  return private.projeto_criar_da_proposta(p_proposta_id, v_dono);
end;
$$;

revoke all on function public.projeto_iniciar(uuid) from public, anon;
grant execute on function public.projeto_iniciar(uuid) to authenticated;

create function public.proposta_portal_visualizar(p_codigo uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_proposta_id uuid;
  v_dono uuid;
begin
  update public.propostas
  set primeira_visualizacao_em = coalesce(primeira_visualizacao_em, now()),
      ultima_visualizacao_em = now(),
      visualizacoes = visualizacoes + 1
  where compartilhamento_codigo = p_codigo
    and compartilhamento_ativo
    and status in ('apresentada', 'aceita', 'recusada')
  returning id, dono into v_proposta_id, v_dono;

  if v_proposta_id is null then
    return false;
  end if;

  insert into public.proposta_portal_eventos (dono, proposta_id, tipo)
  values (v_dono, v_proposta_id, 'visualizada');

  return true;
end;
$$;

revoke all on function public.proposta_portal_visualizar(uuid)
  from public, anon, authenticated;
grant execute on function public.proposta_portal_visualizar(uuid) to service_role;

create function public.proposta_portal_decidir(
  p_codigo uuid,
  p_decisao public.proposta_status,
  p_nome text,
  p_email text,
  p_comentario text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposta_id uuid;
  v_dono uuid;
  v_projeto_id uuid;
  v_nome text := nullif(btrim(coalesce(p_nome, '')), '');
  v_email text := lower(nullif(btrim(coalesce(p_email, '')), ''));
  v_comentario text := nullif(btrim(coalesce(p_comentario, '')), '');
begin
  if p_decisao not in ('aceita', 'recusada') then
    raise exception 'decisao_invalida' using errcode = '22023';
  end if;
  if v_nome is null or char_length(v_nome) not between 2 and 120 then
    raise exception 'nome_invalido' using errcode = '22023';
  end if;
  if v_email is null or char_length(v_email) > 254 or position('@' in v_email) < 2 then
    raise exception 'email_invalido' using errcode = '22023';
  end if;
  if char_length(coalesce(v_comentario, '')) > 2000 then
    raise exception 'comentario_invalido' using errcode = '22023';
  end if;

  update public.propostas
  set status = p_decisao,
      decisao_nome = v_nome,
      decisao_email = v_email,
      decisao_comentario = v_comentario,
      decidida_em = now()
  where compartilhamento_codigo = p_codigo
    and compartilhamento_ativo
    and status = 'apresentada'
  returning id, dono into v_proposta_id, v_dono;

  if v_proposta_id is null then
    return null;
  end if;

  insert into public.proposta_portal_eventos (
    dono, proposta_id, tipo, nome, email, comentario
  ) values (
    v_dono, v_proposta_id, p_decisao::text, v_nome, v_email, v_comentario
  );

  if p_decisao = 'aceita' then
    v_projeto_id := private.projeto_criar_da_proposta(v_proposta_id, v_dono);
  end if;

  return jsonb_build_object(
    'proposta_id', v_proposta_id,
    'status', p_decisao,
    'projeto_id', v_projeto_id
  );
end;
$$;

revoke all on function public.proposta_portal_decidir(
  uuid, public.proposta_status, text, text, text
) from public, anon, authenticated;
grant execute on function public.proposta_portal_decidir(
  uuid, public.proposta_status, text, text, text
) to service_role;

commit;

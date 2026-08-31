-- =============================================================================
-- EVOLUCAO POS-ENTREGA
--
-- Depois do aceite final, o projeto ganha uma unica revisao de resultado.
-- Ela guarda o fato observado e a decisao combinada com o cliente sem criar
-- um CRM paralelo ou transformar uma hipotese comercial em resultado.
-- =============================================================================

begin;

create type public.projeto_evolucao_status as enum (
  'agendada',
  'registrada'
);

create type public.projeto_evolucao_decisao as enum (
  'manter',
  'ajustar_garantia',
  'expandir',
  'novo_projeto',
  'encerrar'
);

create table public.projeto_evolucoes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  projeto_execucao_id uuid not null,
  status public.projeto_evolucao_status not null default 'agendada',
  revisao_em date not null,
  resultado_observado text,
  evidencia_resultado_url text,
  decisao public.projeto_evolucao_decisao,
  proximo_passo text,
  proximo_passo_em date,
  compartilhar_cliente boolean not null default true,
  registrada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint projeto_evolucoes_projeto_fk
    foreign key (dono, projeto_execucao_id)
    references public.projetos_execucao (dono, id)
    on delete cascade,
  constraint projeto_evolucoes_resultado_tamanho
    check (
      resultado_observado is null
      or char_length(btrim(resultado_observado)) between 10 and 4000
    ),
  constraint projeto_evolucoes_evidencia_url_valida
    check (
      evidencia_resultado_url is null
      or (
        char_length(evidencia_resultado_url) <= 2048
        and evidencia_resultado_url ~* '^https?://[^[:space:]]+$'
      )
    ),
  constraint projeto_evolucoes_proximo_passo_tamanho
    check (
      proximo_passo is null
      or char_length(btrim(proximo_passo)) between 5 and 2000
    ),
  constraint projeto_evolucoes_estado_valido
    check (
      (
        status = 'agendada'
        and resultado_observado is null
        and decisao is null
        and proximo_passo is null
        and registrada_em is null
      )
      or (
        status = 'registrada'
        and resultado_observado is not null
        and decisao is not null
        and proximo_passo is not null
        and registrada_em is not null
      )
    ),
  unique (projeto_execucao_id),
  unique (dono, id)
);

comment on table public.projeto_evolucoes is
  'Revisao factual de resultado e decisao de continuidade depois do aceite final do projeto.';
comment on column public.projeto_evolucoes.resultado_observado is
  'Mudanca real confirmada na operacao. Nao deve ser preenchida por inferencia da IA.';
comment on column public.projeto_evolucoes.compartilhar_cliente is
  'Controla se resultado e proximo passo aparecem no portal publico do projeto.';

create index projeto_evolucoes_dono_status_revisao_idx
  on public.projeto_evolucoes (dono, status, revisao_em);

create trigger projeto_evolucoes_atualizado_em
  before update on public.projeto_evolucoes
  for each row execute function private.tocar_atualizado_em();

alter table public.projeto_evolucoes enable row level security;

create policy projeto_evolucoes_select on public.projeto_evolucoes
  for select to authenticated
  using (dono = (select auth.uid()));

revoke all on table public.projeto_evolucoes from anon, authenticated;
grant select on table public.projeto_evolucoes to authenticated;

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
      'projeto_encerrado',
      'revisao_resultado_registrada'
    ));

create function private.projeto_evolucao_criar_apos_aceite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'encerrado' and old.status is distinct from 'encerrado' then
    insert into public.projeto_evolucoes (
      dono,
      projeto_execucao_id,
      revisao_em
    ) values (
      new.dono,
      new.projeto_execucao_id,
      case
        when new.garantia_dias > 0 then least(
          (new.aceito_em + interval '30 days')::date,
          new.garantia_termina_em::date
        )
        else (new.aceito_em + interval '30 days')::date
      end
    )
    on conflict (projeto_execucao_id) do nothing;
  end if;

  return new;
end;
$$;

revoke execute on function private.projeto_evolucao_criar_apos_aceite()
  from public, anon, authenticated;

create trigger projeto_encerramentos_criar_evolucao
  after update of status on public.projeto_encerramentos
  for each row execute function private.projeto_evolucao_criar_apos_aceite();

create function public.projeto_evolucao_agendar(
  p_projeto_id uuid,
  p_revisao_em date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_evolucao_id uuid;
begin
  if v_dono is null then
    raise exception 'sessao_obrigatoria';
  end if;

  if p_revisao_em < current_date or p_revisao_em > current_date + 365 then
    raise exception 'data_revisao_invalida';
  end if;

  update public.projeto_evolucoes evolucao
  set revisao_em = p_revisao_em
  from public.projetos_execucao projeto
  where evolucao.projeto_execucao_id = p_projeto_id
    and evolucao.dono = v_dono
    and evolucao.status = 'agendada'
    and projeto.id = evolucao.projeto_execucao_id
    and projeto.dono = evolucao.dono
    and projeto.status = 'concluido'
  returning evolucao.id into v_evolucao_id;

  if v_evolucao_id is null then
    raise exception 'revisao_indisponivel';
  end if;

  return v_evolucao_id;
end;
$$;

revoke execute on function public.projeto_evolucao_agendar(uuid, date)
  from public, anon;
grant execute on function public.projeto_evolucao_agendar(uuid, date)
  to authenticated;

create function public.projeto_evolucao_registrar(
  p_projeto_id uuid,
  p_resultado_observado text,
  p_evidencia_resultado_url text,
  p_decisao public.projeto_evolucao_decisao,
  p_proximo_passo text,
  p_proximo_passo_em date,
  p_compartilhar_cliente boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := auth.uid();
  v_evolucao_id uuid;
begin
  if v_dono is null then
    raise exception 'sessao_obrigatoria';
  end if;

  if char_length(btrim(coalesce(p_resultado_observado, ''))) not between 10 and 4000
    or char_length(btrim(coalesce(p_proximo_passo, ''))) not between 5 and 2000
  then
    raise exception 'revisao_incompleta';
  end if;

  if p_evidencia_resultado_url is not null
    and btrim(p_evidencia_resultado_url) <> ''
    and btrim(p_evidencia_resultado_url) !~* '^https?://[^[:space:]]+$'
  then
    raise exception 'evidencia_invalida';
  end if;

  if p_proximo_passo_em is not null and p_proximo_passo_em < current_date then
    raise exception 'data_proximo_passo_invalida';
  end if;

  update public.projeto_evolucoes evolucao
  set
    status = 'registrada',
    resultado_observado = btrim(p_resultado_observado),
    evidencia_resultado_url = nullif(btrim(coalesce(p_evidencia_resultado_url, '')), ''),
    decisao = p_decisao,
    proximo_passo = btrim(p_proximo_passo),
    proximo_passo_em = p_proximo_passo_em,
    compartilhar_cliente = coalesce(p_compartilhar_cliente, false),
    registrada_em = now()
  from public.projetos_execucao projeto
  where evolucao.projeto_execucao_id = p_projeto_id
    and evolucao.dono = v_dono
    and evolucao.status = 'agendada'
    and projeto.id = evolucao.projeto_execucao_id
    and projeto.dono = evolucao.dono
    and projeto.status = 'concluido'
  returning evolucao.id into v_evolucao_id;

  if v_evolucao_id is null then
    raise exception 'revisao_indisponivel';
  end if;

  if coalesce(p_compartilhar_cliente, false) then
    insert into public.projeto_portal_eventos (
      dono,
      projeto_execucao_id,
      tipo,
      autor,
      comentario
    ) values (
      v_dono,
      p_projeto_id,
      'revisao_resultado_registrada',
      'prestador',
      btrim(p_proximo_passo)
    );
  end if;

  return v_evolucao_id;
end;
$$;

revoke execute on function public.projeto_evolucao_registrar(
  uuid, text, text, public.projeto_evolucao_decisao, text, date, boolean
) from public, anon;
grant execute on function public.projeto_evolucao_registrar(
  uuid, text, text, public.projeto_evolucao_decisao, text, date, boolean
) to authenticated;

-- Projetos encerrados antes desta migracao tambem recebem uma revisao. Para
-- termos antigos sem garantia, a referencia continua sendo trinta dias.
insert into public.projeto_evolucoes (
  dono,
  projeto_execucao_id,
  revisao_em
)
select
  encerramento.dono,
  encerramento.projeto_execucao_id,
  case
    when encerramento.garantia_dias > 0 then least(
      (encerramento.aceito_em + interval '30 days')::date,
      encerramento.garantia_termina_em::date
    )
    else (encerramento.aceito_em + interval '30 days')::date
  end
from public.projeto_encerramentos encerramento
where encerramento.status = 'encerrado'
on conflict (projeto_execucao_id) do nothing;

commit;

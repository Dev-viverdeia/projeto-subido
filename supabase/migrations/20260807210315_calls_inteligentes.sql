-- =============================================================================
-- CALLS INTELIGENTES
--
-- A call nasce ligada a uma oportunidade e passa a alimentar a mesma linha do
-- tempo factual do CRM. Esta migration prepara todo o ciclo: agenda, sala,
-- participantes, gravação, transcrição, análise e sugestões do Live Coach.
--
-- O código público é uma capacidade aleatória de 122 bits. Ele nunca dá acesso
-- direto às tabelas: uma RPC SECURITY DEFINER devolve apenas os cinco campos que
-- a sala de espera precisa. O restante continua privado por dono e RLS.
-- =============================================================================

create type public.calls_tipo as enum (
  'descoberta',
  'follow_up',
  'proposta',
  'kickoff',
  'entrega',
  'outro'
);

create type public.calls_status as enum (
  'agendada',
  'aguardando',
  'ao_vivo',
  'processando',
  'concluida',
  'cancelada'
);

create table public.calls_reunioes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  contato_id uuid,
  oportunidade_id uuid not null,
  titulo text not null,
  tipo public.calls_tipo not null default 'descoberta',
  agendada_para timestamptz not null,
  duracao_minutos smallint not null default 45,
  status public.calls_status not null default 'agendada',
  codigo_publico uuid not null default gen_random_uuid(),
  sala_provedor text not null default ('subido-' || replace(gen_random_uuid()::text, '-', '')),
  provedor text not null default 'livekit',
  live_coach_ativo boolean not null default true,
  iniciada_em timestamptz,
  encerrada_em timestamptz,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),

  constraint calls_reunioes_titulo_tamanho
    check (char_length(btrim(titulo)) between 1 and 180),
  constraint calls_reunioes_duracao_intervalo
    check (duracao_minutos between 15 and 240),
  constraint calls_reunioes_provedor_tamanho
    check (char_length(btrim(provedor)) between 1 and 40),
  constraint calls_reunioes_empresa_fk
    foreign key (dono, empresa_id)
    references public.crm_empresas (dono, id)
    on delete cascade,
  constraint calls_reunioes_contato_fk
    foreign key (dono, empresa_id, contato_id)
    references public.crm_contatos (dono, empresa_id, id)
    on delete restrict,
  constraint calls_reunioes_oportunidade_fk
    foreign key (dono, empresa_id, oportunidade_id)
    references public.crm_oportunidades (dono, empresa_id, id)
    on delete cascade,
  unique (dono, id),
  unique (codigo_publico),
  unique (sala_provedor)
);

comment on table public.calls_reunioes is
  'Reuniões comerciais e de entrega ligadas obrigatoriamente ao CRM do profissional.';
comment on column public.calls_reunioes.codigo_publico is
  'Capacidade aleatória usada no link da sala. Não concede SELECT direto e pode ser rotacionada.';

create table public.calls_participantes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  reuniao_id uuid not null,
  papel text not null,
  nome text not null,
  email text,
  identidade_provedor text,
  entrou_em timestamptz,
  saiu_em timestamptz,
  total_segundos integer check (total_segundos is null or total_segundos >= 0),
  consentiu_gravacao_em timestamptz,
  criado_em timestamptz not null default now(),

  constraint calls_participantes_papel_valido
    check (papel in ('anfitriao', 'convidado', 'observador')),
  constraint calls_participantes_nome_tamanho
    check (char_length(btrim(nome)) between 1 and 160),
  constraint calls_participantes_reuniao_fk
    foreign key (dono, reuniao_id)
    references public.calls_reunioes (dono, id)
    on delete cascade
);

create table public.calls_gravacoes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  reuniao_id uuid not null,
  id_provedor text,
  caminho_arquivo text,
  status text not null default 'pendente',
  duracao_segundos integer check (duracao_segundos is null or duracao_segundos >= 0),
  iniciada_em timestamptz,
  encerrada_em timestamptz,
  erro text,
  criado_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),

  constraint calls_gravacoes_status_valido
    check (status in ('pendente', 'gravando', 'processando', 'concluida', 'falhou')),
  constraint calls_gravacoes_reuniao_fk
    foreign key (dono, reuniao_id)
    references public.calls_reunioes (dono, id)
    on delete cascade
);

create table public.calls_transcricoes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  reuniao_id uuid not null,
  status text not null default 'pendente',
  texto_completo text,
  segmentos jsonb not null default '[]'::jsonb,
  idioma text not null default 'pt-BR',
  provedor text,
  modelo text,
  duracao_segundos integer check (duracao_segundos is null or duracao_segundos >= 0),
  erro text,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),

  constraint calls_transcricoes_status_valido
    check (status in ('pendente', 'processando', 'concluida', 'falhou')),
  constraint calls_transcricoes_reuniao_fk
    foreign key (dono, reuniao_id)
    references public.calls_reunioes (dono, id)
    on delete cascade,
  unique (reuniao_id)
);

create table public.calls_analises (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  reuniao_id uuid not null,
  status text not null default 'pendente',
  resumo text,
  dores jsonb not null default '[]'::jsonb,
  objecoes jsonb not null default '[]'::jsonb,
  compromissos jsonb not null default '[]'::jsonb,
  proximos_passos jsonb not null default '[]'::jsonb,
  oportunidades_projeto jsonb not null default '[]'::jsonb,
  sentimento text,
  nota_comercial smallint check (nota_comercial is null or nota_comercial between 0 and 100),
  dados jsonb not null default '{}'::jsonb,
  erro text,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),

  constraint calls_analises_status_valido
    check (status in ('pendente', 'processando', 'concluida', 'falhou')),
  constraint calls_analises_reuniao_fk
    foreign key (dono, reuniao_id)
    references public.calls_reunioes (dono, id)
    on delete cascade,
  unique (reuniao_id)
);

create table public.calls_coach_sugestoes (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  reuniao_id uuid not null,
  categoria text not null,
  titulo text not null,
  sugestao text not null,
  metodologia text,
  trecho_gatilho text,
  segundo_reuniao integer check (segundo_reuniao is null or segundo_reuniao >= 0),
  confianca numeric(4, 3) check (confianca is null or confianca between 0 and 1),
  status text not null default 'nova',
  criada_em timestamptz not null default now(),

  constraint calls_coach_status_valido
    check (status in ('nova', 'vista', 'aplicada', 'dispensada')),
  constraint calls_coach_reuniao_fk
    foreign key (dono, reuniao_id)
    references public.calls_reunioes (dono, id)
    on delete cascade
);

-- Leituras operacionais e do detalhe pós-call.
create index calls_reunioes_agenda_idx
  on public.calls_reunioes (dono, agendada_para desc, status);
create index calls_reunioes_oportunidade_idx
  on public.calls_reunioes (dono, oportunidade_id, agendada_para desc);
create index calls_participantes_reuniao_idx
  on public.calls_participantes (dono, reuniao_id, criado_em);
create index calls_gravacoes_reuniao_idx
  on public.calls_gravacoes (dono, reuniao_id, criado_em desc);
create index calls_coach_reuniao_idx
  on public.calls_coach_sugestoes (dono, reuniao_id, criada_em);

create trigger calls_reunioes_atualizada_em
  before update on public.calls_reunioes
  for each row execute function private.tocar_atualizado_em();
create trigger calls_gravacoes_atualizada_em
  before update on public.calls_gravacoes
  for each row execute function private.tocar_atualizado_em();
create trigger calls_transcricoes_atualizada_em
  before update on public.calls_transcricoes
  for each row execute function private.tocar_atualizado_em();
create trigger calls_analises_atualizada_em
  before update on public.calls_analises
  for each row execute function private.tocar_atualizado_em();

-- Um único trigger traduz o estado da call em fatos do CRM e próxima ação.
create function private.calls_registrar_fato()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_titulo text;
begin
  if tg_op = 'INSERT' then
    insert into public.crm_eventos (
      dono, empresa_id, contato_id, oportunidade_id,
      tipo, titulo, dados, fonte, fonte_id, ocorrido_em
    ) values (
      new.dono, new.empresa_id, new.contato_id, new.oportunidade_id,
      'call_agendada', 'Call agendada',
      jsonb_build_object(
        'reuniao_id', new.id,
        'tipo', new.tipo,
        'agendada_para', new.agendada_para,
        'duracao_minutos', new.duracao_minutos,
        'live_coach_ativo', new.live_coach_ativo
      ),
      'calls', new.id::text, new.criada_em
    );

    update public.crm_oportunidades
    set
      proxima_acao = 'Realizar call: ' || new.titulo,
      proxima_acao_em = new.agendada_para
    where id = new.oportunidade_id and dono = new.dono;

    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  v_titulo := case new.status
    when 'aguardando' then 'Sala de call aberta'
    when 'ao_vivo' then 'Call iniciada'
    when 'processando' then 'Call encerrada, processamento iniciado'
    when 'concluida' then 'Call concluída'
    when 'cancelada' then 'Call cancelada'
    else 'Status da call alterado'
  end;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id,
    tipo, titulo, dados, fonte, fonte_id, ocorrido_em
  ) values (
    new.dono, new.empresa_id, new.contato_id, new.oportunidade_id,
    'call_status', v_titulo,
    jsonb_build_object('reuniao_id', new.id, 'de', old.status, 'para', new.status),
    'calls', new.id::text, now()
  );

  if new.status = 'concluida' then
    update public.crm_oportunidades
    set
      proxima_acao = 'Revisar resumo e próximos passos da call',
      proxima_acao_em = null
    where id = new.oportunidade_id and dono = new.dono;
  elsif new.status = 'cancelada' then
    update public.crm_oportunidades
    set proxima_acao = null, proxima_acao_em = null
    where id = new.oportunidade_id
      and dono = new.dono
      and proxima_acao_em = new.agendada_para;
  end if;

  return new;
end;
$$;

revoke execute on function private.calls_registrar_fato() from public;
revoke execute on function private.calls_registrar_fato() from authenticated;

create trigger calls_reuniao_fato_criada
  after insert on public.calls_reunioes
  for each row execute function private.calls_registrar_fato();
create trigger calls_reuniao_fato_status
  after update of status on public.calls_reunioes
  for each row execute function private.calls_registrar_fato();

-- RLS: o profissional enxerga apenas sua operação. Integrações de gravação e IA
-- escrevem como serviço e não recebem uma policy pública de conveniência.
alter table public.calls_reunioes enable row level security;
alter table public.calls_participantes enable row level security;
alter table public.calls_gravacoes enable row level security;
alter table public.calls_transcricoes enable row level security;
alter table public.calls_analises enable row level security;
alter table public.calls_coach_sugestoes enable row level security;

create policy calls_reunioes_select on public.calls_reunioes
  for select to authenticated using (dono = (select auth.uid()));
create policy calls_reunioes_insert on public.calls_reunioes
  for insert to authenticated with check (dono = (select auth.uid()));
create policy calls_reunioes_update on public.calls_reunioes
  for update to authenticated using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

create policy calls_participantes_select on public.calls_participantes
  for select to authenticated using (dono = (select auth.uid()));
create policy calls_gravacoes_select on public.calls_gravacoes
  for select to authenticated using (dono = (select auth.uid()));
create policy calls_transcricoes_select on public.calls_transcricoes
  for select to authenticated using (dono = (select auth.uid()));
create policy calls_analises_select on public.calls_analises
  for select to authenticated using (dono = (select auth.uid()));
create policy calls_coach_sugestoes_select on public.calls_coach_sugestoes
  for select to authenticated using (dono = (select auth.uid()));

-- Agendamento atômico: a empresa e o contato vêm da oportunidade real, nunca de
-- campos livres que poderiam formar vínculos inconsistentes.
create function public.calls_agendar_reuniao(
  p_oportunidade uuid,
  p_tipo public.calls_tipo,
  p_agendada_para timestamptz,
  p_duracao_minutos smallint default 45,
  p_titulo text default null,
  p_live_coach_ativo boolean default true
)
returns table (reuniao_id uuid, codigo_publico uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa uuid;
  v_contato uuid;
  v_titulo_oportunidade text;
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;
  if p_agendada_para is null then
    raise exception 'data_invalida' using errcode = '22023';
  end if;
  if p_duracao_minutos not between 15 and 240 then
    raise exception 'duracao_invalida' using errcode = '22023';
  end if;

  select empresa_id, contato_principal_id, titulo
  into v_empresa, v_contato, v_titulo_oportunidade
  from public.crm_oportunidades
  where id = p_oportunidade and dono = v_dono;

  if not found then
    raise exception 'oportunidade_nao_encontrada' using errcode = 'P0002';
  end if;

  return query
  insert into public.calls_reunioes as nova (
    dono, empresa_id, contato_id, oportunidade_id, titulo, tipo,
    agendada_para, duracao_minutos, live_coach_ativo
  ) values (
    v_dono,
    v_empresa,
    v_contato,
    p_oportunidade,
    coalesce(nullif(btrim(coalesce(p_titulo, '')), ''), 'Call · ' || v_titulo_oportunidade),
    p_tipo,
    p_agendada_para,
    p_duracao_minutos,
    p_live_coach_ativo
  )
  returning nova.id, nova.codigo_publico;
end;
$$;

-- Superfície pública mínima. O UUID do convite funciona como capacidade; a RPC
-- não devolve empresa, contato, e-mail, dono ou qualquer outro dado do CRM.
create function public.calls_obter_convite(p_codigo uuid)
returns table (
  reuniao_id uuid,
  titulo text,
  agendada_para timestamptz,
  duracao_minutos smallint,
  status public.calls_status,
  live_coach_ativo boolean,
  sala_provedor text,
  disponivel boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.titulo,
    r.agendada_para,
    r.duracao_minutos,
    r.status,
    r.live_coach_ativo,
    r.sala_provedor,
    (
      r.status in ('agendada', 'aguardando', 'ao_vivo')
      and now() between r.agendada_para - interval '30 minutes'
        and r.agendada_para + make_interval(mins => r.duracao_minutos) + interval '60 minutes'
    )
  from public.calls_reunioes r
  where r.codigo_publico = p_codigo;
$$;

-- Remove os privilégios amplos herdados do projeto antes de devolver o mínimo.
revoke all on public.calls_reunioes, public.calls_participantes, public.calls_gravacoes,
  public.calls_transcricoes, public.calls_analises, public.calls_coach_sugestoes
  from anon;
revoke all on public.calls_reunioes, public.calls_participantes, public.calls_gravacoes,
  public.calls_transcricoes, public.calls_analises, public.calls_coach_sugestoes
  from authenticated;

grant select on public.calls_reunioes, public.calls_participantes, public.calls_gravacoes,
  public.calls_transcricoes, public.calls_analises, public.calls_coach_sugestoes
  to authenticated;
grant insert, update on public.calls_reunioes to authenticated;

revoke execute on function public.calls_agendar_reuniao(
  uuid, public.calls_tipo, timestamptz, smallint, text, boolean
) from public;
revoke execute on function public.calls_agendar_reuniao(
  uuid, public.calls_tipo, timestamptz, smallint, text, boolean
) from anon;
grant execute on function public.calls_agendar_reuniao(
  uuid, public.calls_tipo, timestamptz, smallint, text, boolean
) to authenticated;

revoke execute on function public.calls_obter_convite(uuid) from public;
grant execute on function public.calls_obter_convite(uuid) to anon, authenticated;

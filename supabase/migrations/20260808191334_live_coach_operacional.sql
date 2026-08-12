-- Torna cada intervenção do Live Coach rastreável até o trecho que a provocou.
-- O áudio e a transcrição continuam privados: nenhuma nova permissão é aberta.
alter table public.calls_coach_sugestoes
  add column origem_item_id text,
  add column prioridade smallint not null default 2
    check (prioridade between 1 and 3),
  add column dados jsonb not null default '{}'::jsonb;

create unique index calls_coach_origem_unica_idx
  on public.calls_coach_sugestoes (dono, reuniao_id, origem_item_id)
  where origem_item_id is not null;

comment on column public.calls_coach_sugestoes.origem_item_id is
  'Item final da transcrição que disparou a recomendação; garante idempotência.';
comment on column public.calls_coach_sugestoes.prioridade is
  'Urgência operacional: 1 baixa, 2 média, 3 alta.';
comment on column public.calls_coach_sugestoes.dados is
  'Metadados técnicos privados da geração, sem segredos.';

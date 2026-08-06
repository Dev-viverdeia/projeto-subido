-- CARTÕES INLINE: quando a resposta cita uma solução do catálogo, a função
-- grava os ponteiros junto da mensagem — a tela vira card clicável sem
-- reparsear texto. jsonb nulo = mensagem sem cartão, o caso comum.
alter table public.consultor_mensagens
  add column cartoes jsonb;

comment on column public.consultor_mensagens.cartoes is
  'Cartões inline: [{slug, titulo, categoria}] das soluções do catálogo citadas na resposta. Detectados pela função no texto final.';

-- LIMITE DE USO — tokens por dono por mês, como a plataforma de origem.
-- Quem escreve é a própria função com o JWT do chamador, então as policies
-- de escrita existem e o dono continua sendo a barreira.
create table public.consultor_uso (
  dono uuid not null references auth.users (id) on delete cascade,
  -- Primeiro dia do mês; uma linha por dono por mês.
  mes date not null,
  tokens bigint not null default 0 check (tokens >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (dono, mes)
);

comment on table public.consultor_uso is
  'Uso mensal do Consultor por pessoa (input + output tokens). Teto aplicado na Edge Function.';

alter table public.consultor_uso enable row level security;

create policy consultor_uso_select on public.consultor_uso
  for select to authenticated using (dono = (select auth.uid()));
create policy consultor_uso_insert on public.consultor_uso
  for insert to authenticated with check (dono = (select auth.uid()));
create policy consultor_uso_update on public.consultor_uso
  for update to authenticated using (dono = (select auth.uid()));

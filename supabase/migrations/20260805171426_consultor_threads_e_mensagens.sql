-- CONSULTOR DE IA — conversas persistidas, no mesmo desenho do Builder:
-- a RLS é a barreira (dono = auth.uid()), a Edge Function repassa o JWT do
-- chamador, e a tela lê tudo por RSC.

create table public.consultor_threads (
  id uuid primary key default gen_random_uuid(),
  dono uuid not null references auth.users (id) on delete cascade,
  -- Nasce do primeiro pedido (corte em 80): a pessoa reconhece a conversa pelo
  -- que perguntou, não por "Conversa 3".
  titulo text not null check (char_length(titulo) between 1 and 120),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.consultor_threads is
  'Conversas do Consultor de IA. Uma linha por conversa; o dono é a barreira de RLS.';

create index consultor_threads_dono_idx on public.consultor_threads (dono, atualizado_em desc);

alter table public.consultor_threads enable row level security;

create policy consultor_threads_select on public.consultor_threads
  for select to authenticated using (dono = (select auth.uid()));
create policy consultor_threads_insert on public.consultor_threads
  for insert to authenticated with check (dono = (select auth.uid()));
create policy consultor_threads_update on public.consultor_threads
  for update to authenticated using (dono = (select auth.uid()));
create policy consultor_threads_delete on public.consultor_threads
  for delete to authenticated using (dono = (select auth.uid()));

create table public.consultor_mensagens (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.consultor_threads (id) on delete cascade,
  papel text not null check (papel in ('usuario', 'consultor')),
  -- 8000: acima do maior turno útil de chat; o teto existe para a chamada paga
  -- não ficar sem fronteira, como o PedidoPerguntas do Builder.
  conteudo text not null check (char_length(conteudo) between 1 and 8000),
  criado_em timestamptz not null default now()
);

comment on table public.consultor_mensagens is
  'Mensagens de cada conversa do Consultor. papel: usuario | consultor.';

create index consultor_mensagens_thread_idx on public.consultor_mensagens (thread_id, criado_em);

alter table public.consultor_mensagens enable row level security;

-- O predicado atravessa para a thread: quem é dono da conversa lê e escreve as
-- mensagens dela. `exists` com subquery — o Postgres resolve por índice.
create policy consultor_mensagens_select on public.consultor_mensagens
  for select to authenticated using (
    exists (
      select 1 from public.consultor_threads t
      where t.id = thread_id and t.dono = (select auth.uid())
    )
  );
create policy consultor_mensagens_insert on public.consultor_mensagens
  for insert to authenticated with check (
    exists (
      select 1 from public.consultor_threads t
      where t.id = thread_id and t.dono = (select auth.uid())
    )
  );
create policy consultor_mensagens_delete on public.consultor_mensagens
  for delete to authenticated using (
    exists (
      select 1 from public.consultor_threads t
      where t.id = thread_id and t.dono = (select auth.uid())
    )
  );

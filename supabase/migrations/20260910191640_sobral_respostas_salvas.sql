-- Referências privadas às respostas, sem duplicar conteúdo nem alterar a conversa.
create table public.consultor_respostas_salvas (
  dono uuid not null references auth.users(id) on delete cascade,
  mensagem_id uuid not null references public.consultor_mensagens(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (dono, mensagem_id)
);

create index consultor_respostas_salvas_mensagem_idx
  on public.consultor_respostas_salvas(mensagem_id);
create index consultor_respostas_salvas_recentes_idx
  on public.consultor_respostas_salvas(dono, criado_em desc, mensagem_id);

alter table public.consultor_respostas_salvas enable row level security;
revoke all on public.consultor_respostas_salvas from anon, authenticated;
grant select, delete on public.consultor_respostas_salvas to authenticated;
grant insert (dono, mensagem_id) on public.consultor_respostas_salvas to authenticated;
grant all on public.consultor_respostas_salvas to service_role;

create policy consultor_respostas_salvas_select
on public.consultor_respostas_salvas for select to authenticated
using (
  dono = (select auth.uid()) and exists (
    select 1 from public.consultor_mensagens m
    join public.consultor_threads t on t.id = m.thread_id
    where m.id = mensagem_id and m.papel = 'consultor'
      and t.dono = (select auth.uid())
  )
);
create policy consultor_respostas_salvas_insert
on public.consultor_respostas_salvas for insert to authenticated
with check (
  dono = (select auth.uid()) and exists (
    select 1 from public.consultor_mensagens m
    join public.consultor_threads t on t.id = m.thread_id
    where m.id = mensagem_id and m.papel = 'consultor'
      and t.dono = (select auth.uid())
  )
);
create policy consultor_respostas_salvas_delete
on public.consultor_respostas_salvas for delete to authenticated
using (dono = (select auth.uid()));

comment on table public.consultor_respostas_salvas is
  'Respostas do Sobral guardadas pelo próprio dono. Remover o marcador não apaga a mensagem.';

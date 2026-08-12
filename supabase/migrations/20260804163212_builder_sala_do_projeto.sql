-- Sala do Projeto: estado de tarefa e escolha de stack.

create type public.estado_tarefa as enum ('a_fazer', 'fazendo', 'feito');

create table public.builder_tarefas (
  solucao_id uuid not null references public.builder_solucoes (id) on delete cascade,
  -- O indice da etapa dentro de `documento->etapas`. A tarefa NAO copia o texto
  -- da etapa: se o documento for regerado, o texto muda e a copia mentiria.
  etapa_indice integer not null check (etapa_indice >= 0),
  estado public.estado_tarefa not null default 'a_fazer',
  atualizado_em timestamptz not null default now(),
  primary key (solucao_id, etapa_indice)
);

create index builder_tarefas_solucao_idx on public.builder_tarefas (solucao_id);

alter table public.builder_tarefas enable row level security;

-- A tarefa herda o dono do projeto. Sem coluna `dono` propria: duas fontes para
-- a mesma verdade divergem, e aqui a verdade e de quem e o projeto.
create policy "tarefa e de quem e o projeto" on public.builder_tarefas
  for select to authenticated
  using (exists (select 1 from public.builder_solucoes s
                  where s.id = solucao_id and s.dono = (select auth.uid())));

create policy "so o dono mexe na propria tarefa" on public.builder_tarefas
  for all to authenticated
  using (exists (select 1 from public.builder_solucoes s
                  where s.id = solucao_id and s.dono = (select auth.uid())))
  with check (exists (select 1 from public.builder_solucoes s
                       where s.id = solucao_id and s.dono = (select auth.uid())));

create trigger builder_tarefas_atualizado_em
  before update on public.builder_tarefas
  for each row execute function private.tocar_atualizado_em();

-- A escolha de onde construir mora no projeto: e um campo do projeto, com um
-- valor por projeto.
alter table public.builder_solucoes
  add column stack text check (stack in ('lovable_supabase', 'lovable_cloud', 'claude_code_supabase'));

comment on table public.builder_tarefas is
  'Estado kanban de cada etapa do documento do Builder. Chave composta (projeto, indice da etapa) — o texto da etapa NAO e copiado, ele mora em documento->etapas e e lido de la.';
comment on column public.builder_solucoes.stack is
  'Onde a pessoa escolheu construir. Nulo = ainda nao escolheu; a etapa Seu Kit pede a escolha antes de mostrar o prompt de partida.';

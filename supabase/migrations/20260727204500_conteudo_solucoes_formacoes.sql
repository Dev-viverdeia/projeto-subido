-- =============================================================================
-- CONTEÚDO: SOLUÇÕES E FORMAÇÕES
--
-- Os dois primeiros pilares ganham tabela. A role `admin` já existia desde
-- 20260727191700 — o que entra aqui é o CONTEÚDO que ela administra.
--
-- DECISÕES QUE VALEM EXPLICAR
--
-- 1. `ordem` NÃO É UNIQUE.
--    A tentação é `unique (solucao_id, ordem)`. Ela transforma toda reordenação
--    num quebra-cabeça: trocar dois itens de lugar viola a constraint no meio do
--    caminho, e a saída vira um UPDATE para valor temporário, depois dois UPDATEs
--    reais — três escritas e uma janela onde o estado é inválido. Sem unique, a
--    reordenação é um UPDATE por linha e a ordenação usa `(ordem, criado_em)`,
--    que é determinística mesmo com empate.
--
-- 2. STATUS EM VEZ DE `publicado boolean`.
--    Um booleano não distingue "ainda não escrevi" de "tirei do ar". Como as duas
--    coisas somem da vitrine mas só uma volta, o enum evita a coluna
--    `arquivado_em` que sempre aparece depois.
--
-- 3. ITENS DA SOLUÇÃO NUMA TABELA SÓ.
--    Etapa, ferramenta e prompt têm a mesma forma (ordem + título + conteúdo) e o
--    mesmo editor. Três tabelas idênticas seriam três policies, três índices e
--    três telas para manter em sincronia.
--
-- 4. LEITURA PÚBLICA É SÓ DO QUE ESTÁ PUBLICADO.
--    Membro lê `publicado`; admin lê tudo. As duas condições vivem numa policy só
--    (um OR), não em duas permissivas — ver 20260727193000 para o motivo.
-- =============================================================================

create type public.status_publicacao as enum ('rascunho', 'publicado', 'arquivado');

-- Slug é o endereço público do conteúdo. A regra no banco existe porque a
-- aplicação não é o único caminho até esta coluna.
create domain public.slug as text
  check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(value) between 3 and 96);

-- -----------------------------------------------------------------------------
-- SOLUÇÕES · pilar 01
-- -----------------------------------------------------------------------------
create table public.solucoes (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  titulo text not null,
  resumo text not null default '',
  categoria text,
  capa_url text,
  /* Vídeo é URL, não arquivo: a landing já decidiu hospedar em Mux ou Panda, e
     servir vídeo do Storage do Supabase custa caro e entrega pior. */
  video_url text,
  status public.status_publicacao not null default 'rascunho',
  publicado_em timestamptz,
  ordem integer not null default 0,
  /* `set null` e não `cascade`: apagar o admin que cadastrou não pode apagar o
     conteúdo que centenas de pessoas estão consumindo. */
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint solucoes_titulo_tamanho check (char_length(titulo) between 3 and 140),
  constraint solucoes_resumo_tamanho check (char_length(resumo) <= 400)
);

comment on table public.solucoes is
  'Pilar 01. Cada solução tem vídeo, passo a passo, ferramentas e prompts.';

create index solucoes_status_idx on public.solucoes (status);
create index solucoes_ordem_idx on public.solucoes (ordem, criado_em);

create table public.solucao_itens (
  id uuid primary key default gen_random_uuid(),
  solucao_id uuid not null references public.solucoes (id) on delete cascade,
  tipo text not null check (tipo in ('etapa', 'ferramenta', 'prompt')),
  ordem integer not null default 0,
  titulo text not null,
  /* Descrição da etapa, URL da ferramenta ou o texto do prompt. */
  conteudo text not null default '',

  constraint solucao_itens_titulo_tamanho check (char_length(titulo) between 1 and 200)
);

comment on table public.solucao_itens is
  'Etapas, ferramentas e prompts. Mesma forma e mesmo editor — daí uma tabela só.';

create index solucao_itens_solucao_idx on public.solucao_itens (solucao_id, tipo, ordem);

-- -----------------------------------------------------------------------------
-- FORMAÇÕES · pilar 02 · formação → módulo → aula
-- -----------------------------------------------------------------------------
create table public.formacoes (
  id uuid primary key default gen_random_uuid(),
  slug public.slug not null unique,
  titulo text not null,
  resumo text not null default '',
  capa_url text,
  status public.status_publicacao not null default 'rascunho',
  publicado_em timestamptz,
  ordem integer not null default 0,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint formacoes_titulo_tamanho check (char_length(titulo) between 3 and 140),
  constraint formacoes_resumo_tamanho check (char_length(resumo) <= 400)
);

comment on table public.formacoes is 'Pilar 02. Trilha completa: módulos e aulas.';

create index formacoes_status_idx on public.formacoes (status);
create index formacoes_ordem_idx on public.formacoes (ordem, criado_em);

create table public.modulos (
  id uuid primary key default gen_random_uuid(),
  formacao_id uuid not null references public.formacoes (id) on delete cascade,
  ordem integer not null default 0,
  titulo text not null,
  criado_em timestamptz not null default now(),

  constraint modulos_titulo_tamanho check (char_length(titulo) between 1 and 140)
);

create index modulos_formacao_idx on public.modulos (formacao_id, ordem);

create table public.aulas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.modulos (id) on delete cascade,
  ordem integer not null default 0,
  titulo text not null,
  video_url text,
  /* Em segundos, inteiro. Guardar "12:34" como texto impede somar a duração de
     um módulo sem fazer parsing em toda leitura. */
  duracao_seg integer check (duracao_seg is null or duracao_seg > 0),
  criado_em timestamptz not null default now(),

  constraint aulas_titulo_tamanho check (char_length(titulo) between 1 and 140)
);

create index aulas_modulo_idx on public.aulas (modulo_id, ordem);

-- -----------------------------------------------------------------------------
-- atualizado_em
-- -----------------------------------------------------------------------------
create trigger solucoes_atualizado_em
  before update on public.solucoes
  for each row execute function private.tocar_atualizado_em();

create trigger formacoes_atualizado_em
  before update on public.formacoes
  for each row execute function private.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- RLS
--
-- Uma policy permissiva por (tabela, papel, ação). Escrita é `for all` só para
-- admin, e a leitura é policy própria — senão o `all` concorreria com ela no
-- SELECT e o Postgres avaliaria as duas em toda consulta.
-- -----------------------------------------------------------------------------
alter table public.solucoes enable row level security;
alter table public.solucao_itens enable row level security;
alter table public.formacoes enable row level security;
alter table public.modulos enable row level security;
alter table public.aulas enable row level security;

create policy "soluções publicadas são visíveis"
  on public.solucoes for select to authenticated
  using (status = 'publicado' or private.eh_admin());

create policy "soluções são escritas por admin"
  on public.solucoes for insert to authenticated with check (private.eh_admin());
create policy "soluções são alteradas por admin"
  on public.solucoes for update to authenticated
  using (private.eh_admin()) with check (private.eh_admin());
create policy "soluções são removidas por admin"
  on public.solucoes for delete to authenticated using (private.eh_admin());

/* Itens herdam a visibilidade do pai. A subconsulta em `solucoes` também passa
   pela RLS dela, o que é exatamente o desejado: quem não enxerga a solução não
   enxerga nenhum item dela. Não há recursão — são tabelas diferentes. */
create policy "itens seguem a solução"
  on public.solucao_itens for select to authenticated
  using (exists (select 1 from public.solucoes s where s.id = solucao_id));

create policy "itens são escritos por admin"
  on public.solucao_itens for insert to authenticated with check (private.eh_admin());
create policy "itens são alterados por admin"
  on public.solucao_itens for update to authenticated
  using (private.eh_admin()) with check (private.eh_admin());
create policy "itens são removidos por admin"
  on public.solucao_itens for delete to authenticated using (private.eh_admin());

create policy "formações publicadas são visíveis"
  on public.formacoes for select to authenticated
  using (status = 'publicado' or private.eh_admin());

create policy "formações são escritas por admin"
  on public.formacoes for insert to authenticated with check (private.eh_admin());
create policy "formações são alteradas por admin"
  on public.formacoes for update to authenticated
  using (private.eh_admin()) with check (private.eh_admin());
create policy "formações são removidas por admin"
  on public.formacoes for delete to authenticated using (private.eh_admin());

create policy "módulos seguem a formação"
  on public.modulos for select to authenticated
  using (exists (select 1 from public.formacoes f where f.id = formacao_id));

create policy "módulos são escritos por admin"
  on public.modulos for insert to authenticated with check (private.eh_admin());
create policy "módulos são alterados por admin"
  on public.modulos for update to authenticated
  using (private.eh_admin()) with check (private.eh_admin());
create policy "módulos são removidos por admin"
  on public.modulos for delete to authenticated using (private.eh_admin());

create policy "aulas seguem o módulo"
  on public.aulas for select to authenticated
  using (exists (select 1 from public.modulos m where m.id = modulo_id));

create policy "aulas são escritas por admin"
  on public.aulas for insert to authenticated with check (private.eh_admin());
create policy "aulas são alteradas por admin"
  on public.aulas for update to authenticated
  using (private.eh_admin()) with check (private.eh_admin());
create policy "aulas são removidas por admin"
  on public.aulas for delete to authenticated using (private.eh_admin());

-- -----------------------------------------------------------------------------
-- Storage das capas
--
-- Bucket público na LEITURA porque capa aparece em listagem e cache de CDN vale
-- mais que segredo nenhum. Escrita continua só de admin.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'capas', 'capas', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "capas são públicas para leitura"
  on storage.objects for select to public
  using (bucket_id = 'capas');

create policy "capas são enviadas por admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'capas' and private.eh_admin());
create policy "capas são trocadas por admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'capas' and private.eh_admin());
create policy "capas são apagadas por admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'capas' and private.eh_admin());

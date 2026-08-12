-- =============================================================================
-- BUILDER · pilar 03
--
-- O implementador descreve a ideia do cliente; o modelo devolve o projeto
-- inteiro. Esta tabela guarda o que foi pedido, o que foi respondido e o
-- documento gerado.
--
-- DECISÕES QUE VALEM EXPLICAR
--
-- 1. O DOCUMENTO É UM JSONB, NÃO SETE TABELAS.
--    A tentação é normalizar as seções (arquitetura, ferramentas, plano de ação,
--    economia…) como linhas de uma `builder_secoes`. Elas não têm ordem editável,
--    não são consultadas isoladamente e nascem TODAS na mesma geração — sete
--    linhas por solução que só existem juntas. O que garante a forma aqui não é o
--    schema do Postgres: é o schema de saída estruturada que a própria API valida
--    antes de responder, e o Zod que revalida antes de gravar. Normalizar
--    duplicaria esse contrato num terceiro lugar, sem ganho de consulta.
--
-- 2. O CONTEXTO FICA SEPARADO DO DOCUMENTO.
--    `ideia_original` e `respostas` são o INSUMO; `documento` é o PRODUTO. Manter
--    os dois é o que permite regerar sem entrevistar de novo — e é o que torna
--    possível auditar depois por que a solução saiu como saiu.
--
-- 3. STATUS COBRE A FALHA NO MEIO.
--    A geração leva dezenas de segundos e pode morrer no caminho. Sem um estado
--    para isso, uma solução meio-gerada fica indistinguível de uma pronta —
--    exatamente a pergunta que a tela de Builder listava como bloqueio. `gerando`
--    e `falhou` existem para a interface poder dizer a verdade.
--
-- 4. O MODELO USADO FICA GRAVADO.
--    Uma solução gerada hoje e outra daqui a seis meses saem de modelos
--    diferentes. Sem registrar qual, nenhuma comparação de qualidade é possível.
--
-- 5. RLS É POR DONO, E SÓ.
--    Diferente de soluções e formações — que são catálogo publicado para todo
--    assinante —, a solução do Builder é trabalho de um implementador sobre o
--    cliente dele. Ninguém mais lê. Admin também não: não há tela de curadoria
--    aqui, e conceder leitura "por precaução" é como vazamento começa.
-- =============================================================================

create type public.status_builder as enum ('rascunho', 'gerando', 'pronta', 'falhou');

create table public.builder_solucoes (
  id uuid primary key default gen_random_uuid(),

  /* `cascade`: ao contrário do catálogo, isto é material privado de uma pessoa.
     Se a conta some, o material dela some junto — é o comportamento que a LGPD
     espera e o que o titular assume ao pedir exclusão. */
  dono uuid not null references auth.users (id) on delete cascade,

  /* Título curto que o modelo devolve. Nasce vazio e é preenchido na geração. */
  titulo text not null default '',

  -- ---- INSUMO -------------------------------------------------------------
  ideia_original text not null,
  /* Perguntas de clarificação e respostas, na ordem em que foram feitas:
     [{ pergunta, porque, resposta }]. Guardar a PERGUNTA junto da resposta é o
     que mantém o registro legível quando o roteiro de perguntas mudar. */
  respostas jsonb not null default '[]'::jsonb,

  -- ---- PRODUTO ------------------------------------------------------------
  /* O documento inteiro, na forma que o schema de saída estruturada garante.
     `null` enquanto não gerou. */
  documento jsonb,

  status public.status_builder not null default 'rascunho',
  /* Preenchido quando `status = 'falhou'` — a interface mostra o motivo em vez de
     um estado vazio sem explicação. */
  erro text,
  /* Qual modelo produziu ESTE documento. Ver decisão 4. */
  modelo text,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  /* Uma solução pronta sem documento é um estado impossível que só apareceria
     depois, como bug. O banco recusa desde já. */
  constraint documento_presente_quando_pronta
    check (status <> 'pronta' or documento is not null),
  constraint erro_presente_quando_falhou
    check (status <> 'falhou' or erro is not null)
);

/* A tela lista as soluções de UMA pessoa, mais recentes primeiro. O índice
   composto atende a consulta inteira sem tocar a tabela. */
create index builder_solucoes_dono_criado_em_idx
  on public.builder_solucoes (dono, criado_em desc);

create trigger tocar_atualizado_em
  before update on public.builder_solucoes
  for each row execute function private.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- RLS · o dono, e ninguém mais
-- -----------------------------------------------------------------------------
alter table public.builder_solucoes enable row level security;

/* `(select auth.uid())` dentro de subquery: o Postgres promove a InitPlan e
   avalia uma vez por query em vez de uma vez por linha. Regra da casa. */
create policy "solução do builder visível para o dono"
  on public.builder_solucoes for select
  to authenticated
  using ((select auth.uid()) = dono);

create policy "solução do builder criada pelo dono"
  on public.builder_solucoes for insert
  to authenticated
  with check ((select auth.uid()) = dono);

create policy "solução do builder alterada pelo dono"
  on public.builder_solucoes for update
  to authenticated
  using ((select auth.uid()) = dono)
  with check ((select auth.uid()) = dono);

create policy "solução do builder apagada pelo dono"
  on public.builder_solucoes for delete
  to authenticated
  using ((select auth.uid()) = dono);

comment on table public.builder_solucoes is
  'Projetos gerados pelo Builder. Material privado do implementador — RLS por dono, sem leitura de admin.';

comment on column public.builder_solucoes.documento is
  'Documento gerado, na forma garantida pelo schema de saída estruturada da API. Ver src/lib/builder/schema.ts — mudar um sem o outro quebra a leitura das soluções já gravadas.';

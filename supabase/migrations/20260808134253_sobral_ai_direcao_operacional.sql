-- =============================================================================
-- SOBRAL AI · DIREÇÃO OPERACIONAL
--
-- O chat deixa de ser a única memória do consultor. Este plano guarda a leitura
-- atual da operação: etapa comprovada por fatos, próximo passo e três ações com
-- evidência objetiva. A IA escreve a orientação; o código determina a etapa.
--
-- Escrita é exclusiva do servidor autenticado da aplicação. O navegador pode
-- ler o próprio plano e enviar mensagens de usuário, mas não pode fabricar uma
-- resposta do Sobral AI, adulterar consumo nem reatribuir o dono de uma thread.
-- =============================================================================

create type public.sobral_etapa as enum (
  'aprender',
  'prospectar',
  'vender',
  'entregar',
  'evoluir'
);

create table public.sobral_planos (
  dono uuid primary key references auth.users (id) on delete cascade,
  etapa public.sobral_etapa not null,
  diagnostico text not null,
  foco text not null,
  proximo_passo jsonb not null,
  acoes jsonb not null,
  sinais jsonb not null default '{}'::jsonb,
  contexto_hash text not null,
  modelo text not null,
  gerado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint sobral_planos_diagnostico_tamanho
    check (char_length(btrim(diagnostico)) between 20 and 1200),
  constraint sobral_planos_foco_tamanho
    check (char_length(btrim(foco)) between 3 and 180),
  constraint sobral_planos_proximo_passo_objeto
    check (jsonb_typeof(proximo_passo) = 'object'),
  constraint sobral_planos_acoes_array
    check (jsonb_typeof(acoes) = 'array' and jsonb_array_length(acoes) between 1 and 3),
  constraint sobral_planos_sinais_objeto
    check (jsonb_typeof(sinais) = 'object'),
  constraint sobral_planos_documento_tamanho
    check (octet_length(proximo_passo::text) + octet_length(acoes::text) + octet_length(sinais::text) <= 32000),
  constraint sobral_planos_contexto_hash_tamanho
    check (char_length(contexto_hash) between 16 and 128),
  constraint sobral_planos_modelo_tamanho
    check (char_length(modelo) between 2 and 120)
);

comment on table public.sobral_planos is
  'Direção operacional mais recente do Sobral AI por profissional. Privada e escrita apenas pelo servidor.';
comment on column public.sobral_planos.etapa is
  'Etapa calculada deterministicamente a partir dos fatos da plataforma; nunca escolhida pelo modelo.';
comment on column public.sobral_planos.proximo_passo is
  'Ação principal no contrato {titulo, detalhe, evidencia, destino}.';
comment on column public.sobral_planos.acoes is
  'Até três ações ordenadas no mesmo contrato do próximo passo.';
comment on column public.sobral_planos.sinais is
  'Snapshot factual reduzido usado para explicar a direção exibida.';

create trigger sobral_planos_atualizado_em
  before update on public.sobral_planos
  for each row execute function private.tocar_atualizado_em();

alter table public.sobral_planos enable row level security;

create policy sobral_planos_select on public.sobral_planos
  for select to authenticated
  using ((select auth.uid()) = dono);

revoke all on public.sobral_planos from anon, authenticated;
grant select on public.sobral_planos to authenticated;
grant select, insert, update, delete on public.sobral_planos to service_role;

-- A direção também acompanha a mensagem que a produziu. Isso permite reabrir
-- uma conversa antiga e ver o próximo passo daquele momento, sem reprocessar o
-- texto nem depender do plano global mais recente.
alter table public.consultor_mensagens
  add column direcao jsonb,
  add column modelo text;

alter table public.consultor_mensagens
  add constraint consultor_mensagens_direcao_objeto
    check (direcao is null or jsonb_typeof(direcao) = 'object'),
  add constraint consultor_mensagens_direcao_tamanho
    check (direcao is null or octet_length(direcao::text) <= 24000),
  add constraint consultor_mensagens_modelo_tamanho
    check (modelo is null or char_length(modelo) between 2 and 120);

comment on column public.consultor_mensagens.direcao is
  'Snapshot estruturado {etapa, diagnostico, foco, proximo_passo, acoes} produzido nesta rodada.';
comment on column public.consultor_mensagens.modelo is
  'Modelo que produziu a resposta do Sobral AI.';

-- O navegador só cria a voz do usuário. Resposta, cartões e direção são
-- inseridos pelo Route Handler depois de autenticar o dono da thread.
drop policy if exists consultor_mensagens_insert on public.consultor_mensagens;
create policy consultor_mensagens_insert_usuario on public.consultor_mensagens
  for insert to authenticated
  with check (
    papel = 'usuario'
    and cartoes is null
    and direcao is null
    and modelo is null
    and exists (
      select 1
      from public.consultor_threads t
      where t.id = thread_id
        and t.dono = (select auth.uid())
    )
  );

revoke insert on public.consultor_mensagens from authenticated;
grant insert on public.consultor_mensagens to authenticated;
grant select, insert, delete on public.consultor_mensagens to service_role;

-- Uma thread nunca pode trocar de dono por UPDATE.
drop policy if exists consultor_threads_update on public.consultor_threads;
create policy consultor_threads_update on public.consultor_threads
  for update to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

-- Uso é um contador de infraestrutura. O profissional lê o próprio consumo,
-- mas só o servidor registra tokens devolvidos pelo provedor.
drop policy if exists consultor_uso_insert on public.consultor_uso;
drop policy if exists consultor_uso_update on public.consultor_uso;

revoke insert, update on public.consultor_uso from authenticated;
grant select on public.consultor_uso to authenticated;
grant select, insert, update on public.consultor_uso to service_role;

create function public.registrar_uso_sobral(
  p_dono uuid,
  p_mes date,
  p_tokens bigint
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  insert into public.consultor_uso as uso (dono, mes, tokens, atualizado_em)
  values (p_dono, p_mes, greatest(p_tokens, 0), now())
  on conflict (dono, mes)
  do update set
    tokens = uso.tokens + excluded.tokens,
    atualizado_em = now()
  returning tokens;
$$;

comment on function public.registrar_uso_sobral(uuid, date, bigint) is
  'Incrementa atomicamente o consumo do Sobral AI. Executável somente pelo service_role.';

revoke all on function public.registrar_uso_sobral(uuid, date, bigint) from public, anon, authenticated;
grant execute on function public.registrar_uso_sobral(uuid, date, bigint) to service_role;

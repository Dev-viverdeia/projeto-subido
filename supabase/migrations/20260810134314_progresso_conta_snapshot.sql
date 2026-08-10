-- Uma leitura única para o estado de progresso da pessoa autenticada.
--
-- A versão anterior fazia quatro requests PostgREST paralelos. Eles não eram
-- sequenciais, mas ainda abriam quatro viagens de rede em toda entrada de
-- Formações, Projetos e Certificados. A função preserva a RLS (`security
-- invoker`) e devolve exatamente o mesmo estado em um snapshot consistente.
create or replace function public.progresso_conta_snapshot()
returns table (
  aulas jsonb,
  formacoes jsonb,
  etapas jsonb,
  solucoes jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(
      (
        select jsonb_object_agg(pa.aula_id::text, pa.concluida_em)
        from public.progresso_aulas pa
        where pa.dono = (select auth.uid())
      ),
      '{}'::jsonb
    ) as aulas,
    coalesce(
      (
        select jsonb_object_agg(f.slug, pf.ultimo_acesso_em)
        from public.progresso_formacoes pf
        join public.formacoes f on f.id = pf.formacao_id
        where pf.dono = (select auth.uid())
      ),
      '{}'::jsonb
    ) as formacoes,
    coalesce(
      (
        select jsonb_object_agg(pe.etapa_chave, pe.concluida_em)
        from public.progresso_etapas pe
        where pe.dono = (select auth.uid())
      ),
      '{}'::jsonb
    ) as etapas,
    coalesce(
      (
        select jsonb_object_agg(s.slug, pp.ultimo_acesso_em)
        from public.progresso_projetos pp
        join public.solucoes s on s.id = pp.projeto_id
        where pp.dono = (select auth.uid())
      ),
      '{}'::jsonb
    ) as solucoes;
$$;

revoke all on function public.progresso_conta_snapshot() from public;
grant execute on function public.progresso_conta_snapshot() to authenticated;

comment on function public.progresso_conta_snapshot() is
  'Snapshot do progresso da pessoa autenticada em uma unica viagem; security invoker preserva RLS.';

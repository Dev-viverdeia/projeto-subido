-- =============================================================================
-- ACORDO OPERACIONAL DO KICKOFF
--
-- A proposta e a análise da call preparam este documento. A confirmação continua
-- sendo humana e libera o portal para o cliente.
-- =============================================================================

begin;

alter table public.projetos_execucao
  add column briefing_kickoff jsonb;

alter table public.projetos_execucao
  add constraint projetos_execucao_briefing_objeto
    check (briefing_kickoff is null or jsonb_typeof(briefing_kickoff) = 'object'),
  add constraint projetos_execucao_briefing_tamanho
    check (briefing_kickoff is null or octet_length(briefing_kickoff::text) <= 50000);

comment on column public.projetos_execucao.briefing_kickoff is
  'Acordo operacional revisado pelo profissional: objetivo, sucesso, responsaveis, acessos, limites e proximos passos. Nunca armazena segredos.';

commit;

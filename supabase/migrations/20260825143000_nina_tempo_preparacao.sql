-- Remove a referência ao diagnóstico descontinuado e mantém o tempo legível
-- no cabeçalho e no painel de progresso do minicurso da Nina.

update public.projeto_roteiros as projeto
set roteiro = jsonb_set(
  projeto.roteiro,
  '{trilhaDidatica,tempoTotal}',
  to_jsonb('35 a 45 minutos'::text),
  false
)
from public.solucoes as solucao
where projeto.projeto_id = solucao.id
  and solucao.slug = 'sdr-atendimento-qualificacao'
  and projeto.roteiro #>> '{trilhaDidatica,tempoTotal}' = '35 a 45 minutos antes do primeiro diagnóstico';

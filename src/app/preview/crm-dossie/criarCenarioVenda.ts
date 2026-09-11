import type { DossieLead } from '@/lib/crm/dossie-types';

/** Dados sintéticos, usados só pela rota de preview bloqueada em produção. */
export function criarCenarioVenda(base: DossieLead, cenario: string): DossieLead {
  const lead = structuredClone(base);
  lead.calls = [];
  lead.acoesPlano = [];
  lead.totalCalls = 0;
  lead.propostaRecente = null;
  lead.projetoAtivo = null;
  lead.projetoRecente = null;
  lead.oportunidade.etapa = 'novo_lead';
  lead.oportunidade.proximaAcao = null;
  lead.oportunidade.proximaAcaoEm = null;
  if (cenario === 'acao-definida') {
    lead.oportunidade.proximaAcao = 'Enviar o escopo pelo WhatsApp';
  }
  if (cenario === 'proposta-offline') {
    lead.propostaRecente = {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Atendimento com IA',
      status: 'rascunho',
      reuniaoId: null,
    };
  }
  if (['aceita', 'entrega', 'concluida'].includes(cenario)) {
    lead.oportunidade.etapa = 'ganho';
    lead.propostaRecente = {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Atendimento com IA',
      status: 'aceita',
      reuniaoId: null,
    };
    if (cenario !== 'aceita')
      lead.projetoRecente = {
        id: '66666666-6666-4666-8666-666666666666',
        titulo: 'Atendimento com IA',
        status: cenario === 'concluida' ? 'concluido' : 'em_execucao',
        atualizadoEm: '2026-09-11T12:00:00Z',
      };
  }
  if (cenario === 'arquivada') lead.oportunidade.situacao = 'arquivada';
  return lead;
}

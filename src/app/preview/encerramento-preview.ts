import type { EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';

export const ENCERRAMENTO_PREVIEW: EncerramentoProjeto = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  status: 'encerrado',
  resumoEntrega:
    'Atendimento com IA configurado no WhatsApp, validado pela recepção e acompanhado durante o piloto.',
  resultadoPrincipal:
    'A primeira resposta passou a acontecer em menos de um minuto nos testes aprovados.',
  evidenciaResultadoUrl: 'https://example.com/resultado',
  garantiaDias: 30,
  garantiaCobre: 'Correções do fluxo, das respostas e das integrações entregues.',
  garantiaNaoCobre: 'Novos canais, novas jornadas e mudanças posteriores de escopo.',
  canalSuporte: 'suporte@mateussilva.com.br',
  responsavelContinuidade: 'Camila Rios · Diretora de operações',
  orientacaoContinuidade:
    'A recepção acompanha diariamente as transferências e registra qualquer desvio no canal de suporte.',
  enviadoEm: '2026-08-10T17:10:00.000Z',
  aceitoEm: '2026-08-10T18:20:00.000Z',
  garantiaTerminaEm: '2026-09-09T18:20:00.000Z',
};

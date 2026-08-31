import { vi } from 'vitest';
import type { EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';

export const ENCERRAMENTO_TESTE: EncerramentoProjeto = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  status: 'rascunho',
  resumoEntrega: 'Atendimento configurado, testado e entregue à recepção.',
  resultadoPrincipal: 'O fluxo final passou pelos testes combinados.',
  evidenciaResultadoUrl: null,
  garantiaDias: 30,
  garantiaCobre: 'Correções do fluxo entregue.',
  garantiaNaoCobre: 'Novas funcionalidades.',
  canalSuporte: 'suporte@exemplo.com',
  responsavelContinuidade: 'Camila Rios',
  orientacaoContinuidade: 'Acompanhar as transferências e registrar qualquer desvio.',
  enviadoEm: null,
  aceitoEm: null,
  garantiaTerminaEm: null,
};

vi.mock('@/lib/projetos-execucao/actions', () => ({
  atualizarTarefaProjeto: vi.fn(),
  configurarPortalCliente: vi.fn(),
  definirPrazoProjeto: vi.fn(),
  definirVisibilidadeArquivoProjeto: vi.fn(),
  excluirArquivoProjeto: vi.fn(),
  registrarArquivoProjeto: vi.fn(),
}));
vi.mock('@/lib/projetos-execucao/entrega-actions', () => ({
  prepararEntregaCliente: vi.fn(),
  reenviarNotificacaoEntregaCliente: vi.fn(),
}));
vi.mock('@/lib/projetos-execucao/encerramento-actions', () => ({
  salvarEncerramentoProjeto: vi.fn(),
}));
vi.mock('@/lib/projetos-execucao/plano-actions', () => ({
  atualizarAcaoPlano: vi.fn(),
  salvarDependenciaProjeto: vi.fn(),
}));
vi.mock('@/lib/projetos-execucao/briefing-actions', () => ({ salvarBriefingKickoff: vi.fn() }));
vi.mock('@/lib/projetos-execucao/escopo-actions', () => ({ analisarMudancaEscopo: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

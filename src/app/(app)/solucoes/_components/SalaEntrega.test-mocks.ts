import { vi } from 'vitest';

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
vi.mock('@/lib/projetos-execucao/plano-actions', () => ({
  atualizarAcaoPlano: vi.fn(),
  salvarDependenciaProjeto: vi.fn(),
}));
vi.mock('@/lib/projetos-execucao/briefing-actions', () => ({ salvarBriefingKickoff: vi.fn() }));
vi.mock('@/lib/projetos-execucao/escopo-actions', () => ({ analisarMudancaEscopo: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

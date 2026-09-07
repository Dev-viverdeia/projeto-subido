import { beforeEach, describe, expect, it, vi } from 'vitest';

const { from, documento } = vi.hoisted(() => ({
  from: vi.fn(),
  documento: {
    cliente: { empresa: 'Cliente QA' },
    projeto: { resumo: 'Resumo público' },
    objetivo: 'Objetivo',
  },
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from }) }));
vi.mock('@/lib/propostas/schema', () => ({ lerDocumentoProposta: () => documento }));
vi.mock('@/lib/env', () => ({ env: {} }));
vi.mock('@/lib/notificacoes/entrega', () => ({
  enviarNotificacaoEntrega: vi.fn(),
  marcarNotificacaoSemDestinatario: vi.fn(),
}));
import { obterPortalCliente } from './servico';

const CODIGO = '11111111-1111-4111-8111-111111111111';
const SEGREDO = 'RASCUNHO_INTERNO_NAO_PUBLICADO';
function preparar(status: string, ativo = true) {
  const base = {
    id: 'projeto-qa',
    titulo: 'Projeto QA',
    status: 'em_execucao',
    documento: {},
    briefing_kickoff: null,
    projeto_tarefas: [],
    projeto_acoes: [],
    projeto_mudancas_escopo: [],
    projeto_evolucoes: [],
    projeto_encerramentos: [
      {
        id: 'termo-qa',
        status,
        resumo_entrega: SEGREDO,
        resultado_principal: SEGREDO,
        canal_suporte: SEGREDO,
      },
    ],
  };
  const principal = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: ativo ? base : null, error: null }),
  };
  const secundarios = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };
  from.mockImplementation((tabela) => (tabela === 'projetos_execucao' ? principal : secundarios));
  return principal;
}
beforeEach(() => vi.clearAllMocks());
describe('fronteira pública do termo de entrega', () => {
  it('não transmite o rascunho, nem no JSON que será serializado em RSC', async () => {
    const consulta = preparar('rascunho');
    const resultado = await obterPortalCliente(CODIGO);
    expect(resultado?.encerramento).toBeNull();
    expect(JSON.stringify(resultado)).not.toContain(SEGREDO);
    expect(consulta.eq).toHaveBeenCalledWith('portal_codigo', CODIGO);
    expect(consulta.eq).toHaveBeenCalledWith('portal_ativo', true);
  });
  it.each(['aguardando_aceite', 'encerrado'])(
    'preserva o termo %s para o cliente',
    async (status) => {
      preparar(status);
      expect((await obterPortalCliente(CODIGO))?.encerramento).toMatchObject({
        status,
        resumoEntrega: SEGREDO,
      });
    },
  );
  it('volta a ocultar o termo após um pedido de ajustes', async () => {
    preparar('aguardando_aceite');
    expect((await obterPortalCliente(CODIGO))?.encerramento).not.toBeNull();
    preparar('rascunho');
    expect(JSON.stringify(await obterPortalCliente(CODIGO))).not.toContain(SEGREDO);
  });
  it('link desativado não retorna o projeto', async () => {
    preparar('encerrado', false);
    expect(await obterPortalCliente(CODIGO)).toBeNull();
  });
});

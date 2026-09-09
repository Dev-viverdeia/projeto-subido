import { it, expect, vi } from 'vitest';
const { eq, linhas } = vi.hoisted(() => ({
  eq: vi.fn(),
  linhas: [
    {
      id: 'mensagem',
      texto: 'Mensagem pública',
      papel: 'equipe',
      criado_em: '2026-09-09',
      nome_autor: 'Ana · Subido',
      canal: 'email',
      suporte_arquivos: [],
    },
  ],
}));
vi.mock('@/lib/suporte/servidor', () => ({
  acessoPublico: vi
    .fn()
    .mockResolvedValue({ caso: { id: '598b3d3e-b9bd-44d3-a04a-a06caa7925c4' } }),
  casoSeguro: (c: unknown) => c,
  criarSistemaSuporte: () => {
    const query = {
      select: vi.fn(),
      eq,
      order: vi.fn(),
      range: vi.fn().mockResolvedValue({ data: linhas, count: 1, error: null }),
    };
    query.select.mockReturnValue(query);
    eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    return { from: () => query };
  },
}));
vi.mock('@/components/suporte/NovoAtendimento', () => ({ NovoAtendimento: () => null }));
vi.mock('@/components/suporte/ConversaAtendimento', () => ({ ConversaAtendimento: () => null }));
import Pagina from './page';
it('mantém autor e origem no acesso público, consultando somente mensagens públicas', async () => {
  const pagina = await Pagina({
    params: Promise.resolve({ id: '598b3d3e-b9bd-44d3-a04a-a06caa7925c4' }),
    searchParams: Promise.resolve({}),
  });
  expect(eq).toHaveBeenCalledWith('interna', false);
  const props = pagina.props as { mensagens: unknown[] };
  expect(props.mensagens[0]).toMatchObject({
    nome_autor: 'Ana · Subido',
    canal: 'email',
    interna: false,
  });
});

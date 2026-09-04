import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const {
  resolverReuniaoProposta,
  listarOpcoesNovaProposta,
  obterPropostaDaReuniao,
  redirect,
  montador,
} = vi.hoisted(() => ({
  resolverReuniaoProposta: vi.fn(),
  listarOpcoesNovaProposta: vi.fn(),
  obterPropostaDaReuniao: vi.fn(),
  redirect: vi.fn(),
  montador: vi.fn(() => null),
}));
vi.mock('@/lib/propostas/contexto-reuniao', () => ({ resolverReuniaoProposta }));
vi.mock('@/lib/propostas/queries', () => ({ listarOpcoesNovaProposta, obterPropostaDaReuniao }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('./_components/MontadorProposta', () => ({ MontadorProposta: montador }));
import NovaPropostaPage from './page';
const cliente = '11111111-1111-4111-8111-111111111111';
const reuniao = '22222222-2222-4222-8222-222222222222';
const props = (parametros: Record<string, string>) => ({
  searchParams: Promise.resolve(parametros),
  params: Promise.resolve({}),
});
describe('entrada da proposta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarOpcoesNovaProposta.mockResolvedValue({
      oportunidades: [{ id: cliente }],
      projetos: [],
      projetosEstudio: [],
    });
    resolverReuniaoProposta.mockResolvedValue({
      oportunidade: { id: cliente },
      reuniao: { id: reuniao, titulo: 'Descoberta' },
      analise: null,
    });
    obterPropostaDaReuniao.mockResolvedValue(null);
    redirect.mockImplementation((url) => {
      throw new Error(`redirect:${url}`);
    });
  });
  it('leva a descoberta para o rascunho e retorna à ficha de origem', async () => {
    render(await NovaPropostaPage(props({ oportunidade: cliente, origem: 'sem-base' })));
    expect(resolverReuniaoProposta).toHaveBeenCalledWith(cliente, '');
    expect(screen.getByRole('link', { name: 'Voltar à ficha' })).toHaveAttribute(
      'href',
      `/vendas/${cliente}`,
    );
    expect(montador).toHaveBeenCalledWith(
      expect.objectContaining({ reuniaoInicial: reuniao, origemInicial: 'sem-base' }),
      undefined,
    );
  });
  it('retorna à reunião quando o usuário veio dela', async () => {
    render(await NovaPropostaPage(props({ oportunidade: cliente, reuniao })));
    expect(screen.getByRole('link', { name: 'Voltar à reunião' })).toHaveAttribute(
      'href',
      `/reunioes/${reuniao}`,
    );
  });
  it('não redireciona para a proposta de uma reunião incompatível', async () => {
    resolverReuniaoProposta.mockResolvedValue(null);
    render(await NovaPropostaPage(props({ oportunidade: cliente, reuniao })));
    expect(obterPropostaDaReuniao).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
    expect(montador).toHaveBeenCalledWith(
      expect.objectContaining({ reuniaoInicial: '', erro: 'reuniao' }),
      undefined,
    );
  });
  it('reaproveita o rascunho vinculado à descoberta', async () => {
    obterPropostaDaReuniao.mockResolvedValue({ id: 'proposta-existente' });
    await expect(NovaPropostaPage(props({ oportunidade: cliente }))).rejects.toThrow(
      'redirect:/propostas/proposta-existente?origem=reuniao',
    );
  });
});

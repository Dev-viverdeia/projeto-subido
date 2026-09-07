import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

const carregar = vi.hoisted(() => vi.fn());
vi.mock('@/lib/prospeccao/queries', () => ({ carregarProspeccao: carregar }));
vi.mock('@/lib/env', () => ({ prospeccaoEnv: () => ({ pronto: true }) }));
vi.mock('./_components/FormularioBusca', () => ({ FormularioBusca: () => null }));
vi.mock('./_components/ListaResultados', () => ({ ListaResultados: () => null }));
import ProspeccaoPage from './page';
import { FormularioBusca } from './_components/FormularioBusca';
import { AcompanhamentoBusca } from './_components/AcompanhamentoBusca';

async function elementos(id: string, status = 'concluida') {
  carregar.mockResolvedValue({
    saldo: 20,
    listas: [],
    leads: [],
    listaAtual: {
      id,
      status,
      segmento: 'Clínicas',
      localizacao: 'Recife',
      quantidade_solicitada: 5,
      creditos_consumidos: 5,
      provedores: {},
    },
  });
  const pagina: ReactElement<{ children: ReactNode }> = await ProspeccaoPage({
    params: Promise.resolve({}),
    searchParams: Promise.resolve({}),
  });
  return Children.toArray(pagina.props.children).filter(isValidElement);
}

it('uma lista confirmada cria outra instância do formulário para a próxima busca intencional', async () => {
  const anterior = (await elementos('lista-anterior')).find((el) => el.type === FormularioBusca);
  const atual = (await elementos('lista-confirmada')).find((el) => el.type === FormularioBusca);
  expect(anterior).toBeDefined();
  expect(atual).toBeDefined();
  expect(atual!.key).not.toBe(anterior!.key);
});

it('preserva o acompanhamento durante a transição final, mesmo sem parâmetro de busca', async () => {
  const processando = (await elementos('mesma-lista', 'processando')).find(
    (el) => el.type === AcompanhamentoBusca,
  );
  const concluida = (await elementos('mesma-lista')).find((el) => el.type === AcompanhamentoBusca);
  expect(processando).toBeDefined();
  expect(concluida).toBeDefined();
  expect(concluida!.key).toBe(processando!.key);
});

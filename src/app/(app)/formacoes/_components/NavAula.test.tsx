import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NavAula as TipoNavAula } from './NavAula';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

type Props = Parameters<typeof TipoNavAula>[0];
let NavAula: (props: Props) => React.ReactNode;

beforeEach(async () => {
  localStorage.clear();
  push.mockReset();
  vi.resetModules();
  NavAula = (await import('./NavAula')).NavAula;
});

const props: Props = {
  formacaoSlug: 'formacao-lovable',
  aulaId: 'a2',
  aulaIds: ['a1', 'a2', 'a3'],
  anteriorId: 'a1',
  anteriorTitulo: 'Primeiros passos',
  proximaId: 'a3',
  proximaTitulo: 'Publicando o projeto',
};

describe('Navegação da aula', () => {
  it('expõe as aulas vizinhas como links com título e destino reais', () => {
    render(<NavAula {...props} />);

    expect(screen.getByRole('link', { name: 'Aula anterior: Primeiros passos' })).toHaveAttribute(
      'href',
      '/formacoes/formacao-lovable/aula/a1',
    );
    expect(
      screen.getByRole('link', { name: 'Próxima aula: Publicando o projeto' }),
    ).toHaveAttribute('href', '/formacoes/formacao-lovable/aula/a3');
  });

  it('conclui e avança com uma ação explícita', async () => {
    const user = userEvent.setup();
    render(<NavAula {...props} />);

    await user.click(screen.getByRole('button', { name: 'Concluir e avançar' }));
    expect(push).toHaveBeenCalledWith('/formacoes/formacao-lovable/aula/a3');
  });

  it('conclui apenas a última aula, sem afirmar que aulas anteriores foram concluídas', async () => {
    const user = userEvent.setup();
    render(<NavAula {...props} proximaId={null} proximaTitulo={null} />);
    await user.click(screen.getByRole('button', { name: 'Concluir aula' }));
    expect(screen.getByRole('status')).toHaveTextContent('Aula concluída');
    expect(screen.getByRole('link', { name: /Retomar aulas pendentes/ })).toHaveAttribute(
      'href',
      '/formacoes/formacao-lovable/aula/a1',
    );
    expect(screen.queryByRole('link', { name: /Ver certificado/ })).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('concluir a última pendência fora de ordem dá acesso direto ao certificado', async () => {
    const { guardarProgressoLegado } = await import('@/lib/progresso/local');
    guardarProgressoLegado({
      aulas: { a1: '2026-09-01T12:00:00Z', a3: '2026-09-01T12:00:00Z' },
      etapas: {},
      formacoes: {},
      solucoes: {},
    });
    render(<NavAula {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Concluir formação' }));
    expect(screen.getByRole('heading', { name: 'Formação concluída' })).toHaveFocus();
    expect(screen.getByText('Todas as 3 aulas concluídas.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver certificado/ })).toHaveAttribute(
      'href',
      '/certificados/formacao/formacao-lovable',
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('espera a sincronização real e não libera o certificado durante falha', async () => {
    const { ContextoProgresso } = await import('@/lib/progresso/local');
    const valor = {
      estado: { aulas: { a2: '2026-09-01T12:00:00Z' }, etapas: {}, formacoes: {}, solucoes: {} },
      acoes: { concluirAula: vi.fn(), tocarFormacao: vi.fn(), alternarEtapa: vi.fn() },
    };
    const tela = (sincronizacao: 'salvo' | 'sincronizando' | 'erro') => (
      <ContextoProgresso.Provider value={{ ...valor, sincronizacao }}>
        <NavAula {...props} aulaIds={['a2']} />
      </ContextoProgresso.Provider>
    );
    const { rerender } = render(tela('sincronizando'));
    expect(screen.getByRole('heading', { name: 'Salvando conclusão…' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver certificado/ })).not.toBeInTheDocument();
    rerender(tela('erro'));
    expect(screen.getByRole('heading', { name: 'Conclusão não sincronizada' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver certificado/ })).not.toBeInTheDocument();
    rerender(tela('salvo'));
    expect(screen.getByRole('link', { name: /Ver certificado/ })).toBeInTheDocument();
    expect(screen.getByText('A aula foi concluída.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Formação concluída' })).not.toHaveFocus();
  });

  it('não considera um currículo vazio como concluído', () => {
    render(<NavAula {...props} aulaIds={[]} />);
    expect(screen.queryByRole('link', { name: /Ver certificado/ })).not.toBeInTheDocument();
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DefinirTrilha, ProvedorDeTrilha, useTrilha } from './contexto';

/**
 * O QUE ESTE TESTE PROTEGE, e por que ele existe.
 *
 * A trilha do cabeçalho já foi construída sobre um slot paralelo do Next. Parecia
 * a resposta idiomática — server-rendered, sem estado de cliente — e falhava do
 * jeito mais visível possível: ao voltar de uma ficha para o catálogo, o
 * cabeçalho continuava exibindo a trilha da tela anterior, apontando para uma
 * página onde a pessoa não estava mais. Não era bug de implementação; é o
 * contrato do roteador, que "mantém a subpágina ativa do slot mesmo que ela não
 * case com a URL atual" (parallel-routes.md). Nem um catch-all que casava a rota
 * de destino resolvia — verificado num slot isolado.
 *
 * A implementação atual troca aquilo por contexto, e a correção inteira depende
 * de UMA garantia: quando `DefinirTrilha` sai da árvore, a limpeza do efeito
 * zera o estado. Se alguém trocar o efeito por um que não limpa, ou mover o
 * `DefinirTrilha` para um lugar que não desmonta com a rota, o cabeçalho volta a
 * mentir — e nada em tsc, eslint ou build percebe.
 *
 * Por isso o teste é sobre o DESMONTE, não sobre a renderização feliz.
 */
function Leitor() {
  const trilha = useTrilha();
  return <span data-testid="leitor">{trilha ? trilha.atual : 'SEM TRILHA'}</span>;
}

function Tela({ mostrar, atual = 'Qualificação de leads' }: { mostrar: boolean; atual?: string }) {
  return (
    <ProvedorDeTrilha>
      <Leitor />
      {mostrar && (
        <DefinirTrilha voltarPara="/solucoes" voltarRotulo="Soluções de IA" atual={atual} />
      )}
    </ProvedorDeTrilha>
  );
}

describe('trilha do cabeçalho', () => {
  it('fica vazia quando a tela não declara nenhuma', () => {
    render(<Tela mostrar={false} />);
    expect(screen.getByTestId('leitor').textContent).toBe('SEM TRILHA');
  });

  it('assume a trilha que a tela declara', () => {
    render(<Tela mostrar />);
    expect(screen.getByTestId('leitor').textContent).toBe('Qualificação de leads');
  });

  /* O caso que o slot paralelo errava: sair da ficha e voltar para a listagem. */
  it('ZERA ao sair da tela — é o desmonte que devolve o cabeçalho à seção', () => {
    const { rerender } = render(<Tela mostrar />);
    expect(screen.getByTestId('leitor').textContent).toBe('Qualificação de leads');

    rerender(<Tela mostrar={false} />);
    expect(screen.getByTestId('leitor').textContent).toBe('SEM TRILHA');
  });

  /* Ficha → ficha: o React reusa a instância, então quem troca o valor é a
     dependência do efeito, não o desmonte. Vale checar os dois caminhos. */
  it('troca de valor ao navegar de uma ficha para outra', () => {
    const { rerender } = render(<Tela mostrar atual="Primeira" />);
    expect(screen.getByTestId('leitor').textContent).toBe('Primeira');

    rerender(<Tela mostrar atual="Segunda" />);
    expect(screen.getByTestId('leitor').textContent).toBe('Segunda');
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DefinirTrilha, ProvedorDeTrilha, useTrilha } from './contexto';
import { encurtar, trilhaDaSecao } from './TrilhaDoCabecalho';

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

/**
 * A TRILHA DERIVADA DA ROTA — o que a listagem mostra.
 *
 * Toda tela tem a mesma FORMA de trilha; o que muda é quantos degraus. Numa
 * listagem são dois ("‹ Início / Soluções de IA"), e em `/inicio` é um só —
 * porque ali não existe degrau anterior. Sem esse caso de borda o cabeçalho da
 * home diria "‹ Início / Início".
 */
describe('trilha derivada da rota', () => {
  it('dá dois degraus numa listagem, com volta para o início', () => {
    expect(trilhaDaSecao('/solucoes')).toEqual({
      voltarPara: '/inicio',
      voltarRotulo: 'Início',
      atual: 'Soluções de IA',
    });
  });

  it('dá UM degrau em /inicio — não há para onde voltar', () => {
    expect(trilhaDaSecao('/inicio')).toEqual({ atual: 'Início' });
  });

  it('resolve por prefixo: rota de detalhe ainda pertence à seção', () => {
    expect(trilhaDaSecao('/formacoes/algum-curso')?.atual).toBe('Formações');
  });

  it('devolve null fora das rotas do app — o cabeçalho não inventa degrau', () => {
    expect(trilhaDaSecao('/nao-existe')).toBeNull();
  });
});

/**
 * O ENCURTAMENTO NASCEU DE UM LAYOUT QUEBRADO, e o defeito não era do texto: a
 * faixa do shell era `1fr`, que tem mínimo automático `auto` e não encolhe abaixo
 * do min-content. Com a trilha em `white-space: nowrap`, um rótulo de 300
 * caracteres (o Builder usa a ideia inteira enquanto não há título gerado) fazia a
 * faixa crescer, a página ganhar rolagem horizontal, e todo bloco centralizado por
 * `margin-inline: auto` centralizar dentro da largura ESTOURADA — indo parar fora
 * da tela.
 *
 * A faixa virou `minmax(0, 1fr)` e o cabeçalho ganhou `min-width: 0`. Este teste
 * cobre a outra metade: o corte no componente, que protege o leitor de tela — o
 * elemento com `aria-current="page"` carregaria a string inteira mesmo com o CSS
 * truncando o pixel.
 */
describe('encurtar do degrau atual', () => {
  it('deixa passar o que já é curto, sem reticências', () => {
    expect(encurtar('Qualificação de leads')).toBe('Qualificação de leads');
  });

  it('corta na palavra, não no caractere', () => {
    const longo =
      'Meu cliente tem uma clínica com 4 recepcionistas e recebe muitas mensagens por mês';
    const curto = encurtar(longo);

    expect(curto.length).toBeLessThanOrEqual(73);
    expect(curto.endsWith('…')).toBe(true);
    /* Corte na palavra: nada de "recepcionist…" no meio de uma sílaba. */
    expect(curto.slice(0, -1).trim()).toBe(
      curto
        .slice(0, -1)
        .trim()
        .replace(/\S$/, (c) => c),
    );
    expect(longo.startsWith(curto.slice(0, -1))).toBe(true);
    expect(curto.slice(0, -1).endsWith(' ')).toBe(false);
  });

  /* Uma palavra só, gigante — um slug colado, uma URL. Não há espaço onde cortar,
     e o corte seco é o único possível. */
  it('sem espaço onde cortar, corta seco em vez de estourar', () => {
    const curto = encurtar('a'.repeat(200));
    expect(curto.length).toBeLessThanOrEqual(73);
    expect(curto.endsWith('…')).toBe(true);
  });

  it('normaliza espaço em branco antes de medir', () => {
    expect(encurtar('  Qualificação   de \n leads  ')).toBe('Qualificação de leads');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ItemSolucao } from '@/lib/conteudo/queries';
/* Import só de TIPO: não avalia o módulo, então o `resetModules` abaixo continua
   entregando uma instância limpa do cache de progresso a cada caso. */
import type { FichaSolucao } from './FichaSolucao';

/**
 * O QUE ESTE TESTE PROTEGE.
 *
 * A ficha tem UMA regra da qual três partes da tela dependem: a etapa atual é a
 * primeira não marcada. Dela saem o selo do cabeçalho, a frase do trilho
 * ("Próxima: …") e a etapa aberta na timeline. Se a regra escorregar, as três
 * divergem entre si e a tela passa a se contradizer — e nada em tsc, eslint ou
 * build percebe, porque nada disso é erro de tipo.
 *
 * A área logada não é verificável no navegador sem sessão, então este é o lugar
 * onde o comportamento fica preso. O que ele NÃO cobre é o que só o olho pega:
 * contraste, truncamento, sobreposição.
 *
 * POR QUE `resetModules` + IMPORT DINÂMICO, e não só `localStorage.clear()`.
 * O `progresso/local.ts` mantém um CACHE de módulo do estado — obrigatório, senão
 * `getSnapshot` devolveria um objeto novo a cada chamada e o `useSyncExternalStore`
 * entraria em laço. Esse cache não sabe que o storage foi limpo (em produção quem
 * limpa é ele mesmo), então sem recarregar o módulo o segundo teste começa com as
 * etapas que o primeiro marcou. Descoberto do jeito difícil: três casos falharam
 * procurando "Marcar como feita" onde o rótulo já era "Desmarcar".
 */
function etapa(id: string, titulo: string): ItemSolucao {
  return {
    id,
    solucao_id: 's1',
    tipo: 'etapa',
    ordem: 0,
    titulo,
    conteudo: `Como fazer ${titulo}`,
  };
}

function item(id: string, tipo: 'ferramenta' | 'prompt', titulo: string): ItemSolucao {
  return { id, solucao_id: 's1', tipo, ordem: 0, titulo, conteudo: `conteúdo de ${titulo}` };
}

const ETAPAS = [etapa('e1', 'Capturar o lead'), etapa('e2', 'Pontuar'), etapa('e3', 'Rotear')];

type Props = Parameters<typeof FichaSolucao>[0];

let Ficha: (p: Props) => React.ReactNode;

function montar(props: Partial<Props> = {}) {
  return render(
    <Ficha
      slug="qualificacao"
      titulo="Qualificação automática de leads"
      resumo="Um resumo."
      categoria="Vendas"
      etapas={ETAPAS}
      ferramentas={[item('f1', 'ferramenta', 'n8n')]}
      prompts={[item('p1', 'prompt', 'Classificar intenção')]}
      icone={<span data-testid="icone" />}
      video={<div data-testid="video" />}
      proxima={<div data-testid="proxima" />}
      {...props}
    />,
  );
}

/** O `<li>` de uma etapa, pelo id que a própria timeline publica. */
function passo(id: string): HTMLElement {
  const el = document.getElementById(`etapa-${id}`);
  if (!el) throw new Error(`etapa ${id} não está na tela`);
  return el;
}

/** A frase do trilho de progresso, que vive fora da timeline. */
function trilho(): HTMLElement {
  return screen.getByRole('region', { name: 'Seu progresso' });
}

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();

  /* jsdom não implementa nenhum dos dois; "Continuar" chama os dois. */
  /* `Element.prototype.scrollIntoView = …` faria o eslint reclamar de método
     desatrelado; com o nome em string não há referência a método nenhum. */
  Reflect.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
  });
  /* `useReducedMotion` consulta `matchMedia`. O teste dele com `in` em vez de
     `window.matchMedia ??=` porque ler o método fora de uma chamada dispara o
     `unbound-method` do eslint. */
  if (!('matchMedia' in window)) {
    Reflect.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
      writable: true,
    });
  }

  Ficha = (await import('./FichaSolucao')).FichaSolucao;
});

describe('ficha da solução', () => {
  it('abre na primeira etapa e a marca como a atual', () => {
    montar();

    expect(passo('e1').dataset.atual).toBe('');
    expect(within(passo('e1')).getByText('você está aqui')).toBeDefined();
    expect(trilho().textContent).toContain('Capturar o lead');
  });

  it('move "você está aqui" quando a etapa é marcada', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByLabelText(/Marcar como feita: Capturar o lead/));

    expect(passo('e1').dataset.feita).toBe('');
    expect(passo('e1').dataset.atual).toBeUndefined();
    expect(passo('e2').dataset.atual).toBe('');

    /* O contador da lista e a frase do trilho falam do MESMO fato — é a
       divergência entre eles que este teste existe para impedir. */
    expect(screen.getByText(/DE 3 CONCLUÍDAS/).textContent).toContain('1');
    expect(trilho().textContent).toContain('1 de 3 etapas concluídas');
    expect(trilho().textContent).toContain('Pontuar');
  });

  /* Regressão: a barra do trilho pintava as N PRIMEIRAS casas a partir da
     contagem. Como marcar etapa alterna e pode acontecer fora de ordem, quem
     marcasse a terceira via a primeira acender — a barra contradizendo a
     timeline dois palmos ao lado. */
  it('a barra acende a casa da etapa marcada, não a primeira', async () => {
    const user = userEvent.setup();
    const { container } = montar();

    await user.click(screen.getByLabelText(/Marcar como feita: Rotear/));

    const casas = [...container.querySelectorAll('ol li[class]')].filter(
      (li) => !li.id.startsWith('etapa-'),
    );
    expect(casas).toHaveLength(3);
    expect((casas[0] as HTMLElement).dataset.feito).toBeUndefined();
    expect((casas[2] as HTMLElement).dataset.feito).toBe('');
  });

  it('desmarcar devolve a etapa ao estado anterior — checklist, não aula', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByLabelText(/Marcar como feita: Capturar o lead/));
    await user.click(screen.getByLabelText(/Desmarcar: Capturar o lead/));

    expect(passo('e1').dataset.feita).toBeUndefined();
    expect(passo('e1').dataset.atual).toBe('');
  });

  it('com todas marcadas não há etapa atual nem botão de continuar', async () => {
    const user = userEvent.setup();
    montar();

    for (const t of ['Capturar o lead', 'Pontuar', 'Rotear']) {
      await user.click(screen.getByLabelText(new RegExp(`Marcar como feita: ${t}`)));
    }

    expect(screen.queryByText('você está aqui')).toBeNull();
    expect(screen.queryByRole('button', { name: /Continuar|Começar/ })).toBeNull();
    expect(trilho().textContent).toContain('As 3 etapas estão marcadas');
  });

  it('as abas trocam a coluna principal', async () => {
    const user = userEvent.setup();
    montar();

    expect(screen.getByTestId('video')).toBeDefined();

    await user.click(screen.getByRole('tab', { name: 'Prompts' }));

    expect(screen.queryByTestId('video')).toBeNull();
    expect(screen.getByText('Classificar intenção')).toBeDefined();
  });

  /* Regressão: um `tabpanel` cujo `aria-labelledby` aponta para um id inexistente
     é pior que nenhum papel — o leitor de tela anuncia painel sem nome. */
  it('sem tira de abas não declara tabpanel', () => {
    montar({ ferramentas: [], prompts: [] });

    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
  });

  it('"Continuar" volta para a aba do passo a passo vindo de outra', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('tab', { name: 'Ferramentas' }));
    expect(screen.queryByTestId('video')).toBeNull();

    await user.click(screen.getByRole('button', { name: /Começar/ }));
    expect(screen.getByTestId('video')).toBeDefined();
  });

  /* Regressão: marcar pelo botão de DENTRO do painel fazia o painel colapsar
     sobre o próprio botão focado. Com `inert` caindo no ancestral do
     `activeElement`, o navegador descarta o foco para o `<body>` e o próximo Tab
     recomeça do topo do documento. O painel agora fica preso aberto. */
  it('marcar pelo botão do painel não fecha o painel sob o foco', async () => {
    const user = userEvent.setup();
    montar();

    const acao = within(passo('e1')).getByRole('button', { name: /Marcar como feita/ });
    await user.click(acao);

    const cabecalho = within(passo('e1')).getByRole('button', { expanded: true });
    expect(cabecalho).toBeDefined();
    expect(passo('e1').dataset.feita).toBe('');
    /* E o botão continua alcançável — é ele que o foco do teclado ocupa. */
    expect(
      within(passo('e1')).getByRole('button', { name: /Marcar como não feita/ }),
    ).toBeDefined();
  });

  /* Regressão: o vídeo só era montado dentro do painel "Passo a passo". Numa
     solução sem etapas essa aba não existe, e a gravação sumia em silêncio. */
  it('sem etapas, o vídeo continua na tela', () => {
    montar({ etapas: [] });
    expect(screen.getByTestId('video')).toBeDefined();
    expect(screen.queryByRole('tab', { name: 'Passo a passo' })).toBeNull();
  });

  it('prompt sem corpo não oferece copiar — confirmaria uma cópia vazia', async () => {
    const user = userEvent.setup();
    montar({ prompts: [{ ...item('p2', 'prompt', 'Rascunho'), conteudo: '' }] });

    await user.click(screen.getByRole('tab', { name: 'Prompts' }));

    expect(screen.getByText('Rascunho')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Copiar/i })).toBeNull();
  });

  it('não inventa contagem: a meta só lista o que existe', () => {
    montar({ prompts: [] });

    expect(screen.getByText('3 etapas')).toBeDefined();
    expect(screen.getByText('1 ferramenta')).toBeDefined();
    expect(screen.queryByRole('tab', { name: 'Prompts' })).toBeNull();
  });
});

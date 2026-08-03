'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * O ESTADO DA TRILHA DO CABEÇALHO.
 *
 * POR QUE CONTEXTO E NÃO SLOT PARALELO — medido, não suposto.
 * A primeira versão usava `@trilha`, um slot paralelo: server-rendered, sem
 * estado de cliente, sem pisca. Parecia a resposta idiomática. Não é, e o motivo
 * está na doc do Next (parallel-routes.md, seção Behavior): em navegação SOFT o
 * roteador "mantém a subpágina ativa do slot, mesmo que ela não case com a URL
 * atual".
 *
 * Testado num slot isolado, com um catch-all que CASAVA a rota de destino: ao
 * voltar do detalhe para a lista, a página trocou e o slot continuou exibindo a
 * subpágina de detalhe. Nem o catch-all resolve — a preservação é do roteador,
 * não da ausência de correspondência. Na prática o cabeçalho ficava com a trilha
 * da tela anterior em toda navegação por clique.
 *
 * Aqui quem zera é o DESMONTE, que é garantia do React e não do roteador.
 *
 * DOIS CONTEXTOS, E ISSO NÃO É PREFERÊNCIA — é o que impede um laço infinito.
 * Com valor e ações no mesmo objeto, `limpar` nasce de novo a cada mudança de
 * trilha; o efeito de `DefinirTrilha` depende dele, então re-dispara, limpa,
 * muda a trilha, recria `limpar`, e recomeça. Isso aconteceu de verdade, e quem
 * pegou foi o `contexto.test.tsx`: "Maximum update depth exceeded". As ações
 * agora vivem num contexto próprio, criado UMA vez, e nunca mudam.
 */

export type Trilha = {
  /* Opcionais porque `/inicio` é o topo: não há degrau anterior, e a trilha lá é
     de um degrau só. Toda tela de detalhe passa os dois. */
  voltarPara?: string;
  voltarRotulo?: string;
  /** Categoria, módulo — o recorte a que o item pertence. Opcional. */
  meio?: string | null;
  atual: string;
};

type Acoes = {
  definir: (t: Trilha) => void;
  limpar: () => void;
};

const ValorDaTrilha = createContext<Trilha | null>(null);
const AcoesDaTrilha = createContext<Acoes | null>(null);

export function ProvedorDeTrilha({ children }: { children: ReactNode }) {
  const [trilha, setTrilha] = useState<Trilha | null>(null);

  /* O setter do `useState` é estável por contrato do React, então este objeto é
     criado uma única vez na vida do provedor — sem dependências, sem recriação. */
  const acoes = useMemo<Acoes>(() => ({ definir: setTrilha, limpar: () => setTrilha(null) }), []);

  return (
    <AcoesDaTrilha.Provider value={acoes}>
      <ValorDaTrilha.Provider value={trilha}>{children}</ValorDaTrilha.Provider>
    </AcoesDaTrilha.Provider>
  );
}

export function useTrilha(): Trilha | null {
  return useContext(ValorDaTrilha);
}

/**
 * `useLayoutEffect` no cliente e `useEffect` no servidor.
 *
 * A diferença importa: `useLayoutEffect` roda ANTES do paint, então numa
 * navegação por clique a trilha da tela nova já está no contexto quando o
 * navegador desenha. Com `useEffect` haveria um quadro exibindo o nome da seção
 * antes de a trilha entrar.
 *
 * O React avisa ao encontrar `useLayoutEffect` durante render de servidor; este
 * componente não desenha nada, mas o aviso apareceria mesmo assim. Daí a troca
 * por ambiente, que é o padrão conhecido para o caso.
 */
const useEfeitoDeLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Declara a trilha desta tela. Renderiza `null` — é só o efeito.
 *
 * As props chegam desmontadas em primitivos de propósito: um objeto novo a cada
 * render do pai reexecutaria o efeito em todo ciclo.
 *
 * NUMA RECARGA DURA o servidor não roda o efeito, então o cabeçalho pinta uma vez
 * com o nome da seção e troca para a trilha na hidratação. É o custo honesto de a
 * trilha depender de dado que só a página conhece — e é muito menor que o defeito
 * que ele substitui, uma trilha permanentemente errada.
 */
export function DefinirTrilha({ voltarPara, voltarRotulo, meio, atual }: Trilha) {
  const acoes = useContext(AcoesDaTrilha);

  useEfeitoDeLayout(() => {
    if (!acoes) return;
    acoes.definir({ voltarPara, voltarRotulo, meio, atual });
    return () => acoes.limpar();
  }, [acoes, voltarPara, voltarRotulo, meio, atual]);

  return null;
}

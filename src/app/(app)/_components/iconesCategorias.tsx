import type { ReactNode } from 'react';
import { Blocks, ChartNoAxesCombined, Megaphone, MessageSquareMore, Waypoints } from 'lucide-react';

/**
 * Categoria de solução → glifo, como ELEMENTOS já renderizados (Server Component
 * only — a regra do navegacao.tsx). Consumido pelo catálogo e pelo Início;
 * promovido para cá na segunda ocorrência, como manda a rule-of-two.
 *
 * Categoria nova criada no admin cai no `ICONE_CATEGORIA_PADRAO` até ganhar
 * entrada aqui.
 */
const TAMANHO = 26;
const TRACO = 1.65;

export const ICONES_CATEGORIAS: Record<string, ReactNode> = {
  Atendimento: <MessageSquareMore size={TAMANHO} strokeWidth={TRACO} />,
  Vendas: <ChartNoAxesCombined size={TAMANHO} strokeWidth={TRACO} />,
  Marketing: <Megaphone size={TAMANHO} strokeWidth={TRACO} />,
  Operações: <Waypoints size={TAMANHO} strokeWidth={TRACO} />,
};

export const ICONE_CATEGORIA_PADRAO: ReactNode = <Blocks size={TAMANHO} strokeWidth={TRACO} />;

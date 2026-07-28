import type { ReactNode } from 'react';
import { Boxes, Headset, Megaphone, TrendingUp, Workflow } from 'lucide-react';

/**
 * Categoria de solução → glifo, como ELEMENTOS já renderizados (Server Component
 * only — a regra do navegacao.tsx). Consumido pelo catálogo e pelo Início;
 * promovido para cá na segunda ocorrência, como manda a rule-of-two.
 *
 * Categoria nova criada no admin cai no `ICONE_CATEGORIA_PADRAO` até ganhar
 * entrada aqui.
 */
const TAMANHO = 20;
const TRACO = 1.8;

export const ICONES_CATEGORIAS: Record<string, ReactNode> = {
  Atendimento: <Headset size={TAMANHO} strokeWidth={TRACO} />,
  Vendas: <TrendingUp size={TAMANHO} strokeWidth={TRACO} />,
  Marketing: <Megaphone size={TAMANHO} strokeWidth={TRACO} />,
  Operações: <Workflow size={TAMANHO} strokeWidth={TRACO} />,
};

export const ICONE_CATEGORIA_PADRAO: ReactNode = <Boxes size={TAMANHO} strokeWidth={TRACO} />;

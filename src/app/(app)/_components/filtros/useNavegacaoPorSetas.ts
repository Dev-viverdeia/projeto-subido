'use client';

import { useRef, type KeyboardEvent } from 'react';

/**
 * As setas do teclado de um `role="tablist"` — a mesma implementação para os dois
 * controles que declaram esse papel.
 *
 * ISTO NÃO É ENFEITE DE ACESSIBILIDADE: `role="tablist"` é uma PROMESSA. Quem usa
 * leitor de tela ouve "guia 2 de 4" e tenta as setas, porque é assim que toda
 * tablist funciona no padrão ARIA. Sem elas o componente anuncia um contrato que
 * não cumpre — pior que não ter papel nenhum.
 *
 * VIROU HOOK PORQUE ERAM DOIS. O `AbasFiltro` ganhou setas e o `ControleSegmentado`
 * ficou sem, embora os dois declarem `role="tablist"` e vivam lado a lado na mesma
 * régua do catálogo. Duas implementações de teclado que precisam ser iguais é a
 * mesma história de sempre; agora existe uma.
 *
 * O TABINDEX ROTATIVO É PARTE DO CONTRATO, não um extra: numa tablist a tira
 * inteira ocupa UMA parada de Tab, e as setas movem dentro dela. Sem isso, quatro
 * categorias viram quatro paradas antes de chegar à busca.
 */
export function useNavegacaoPorSetas<T extends { id: string }>({
  itens,
  ativa,
  aoMudar,
}: {
  itens: T[];
  ativa: string;
  aoMudar: (id: string) => void;
}) {
  const trilho = useRef<HTMLDivElement>(null);

  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    const indice = itens.findIndex((i) => i.id === ativa);
    let destino: number;

    switch (e.key) {
      /* Circular: da última volta para a primeira, como manda o padrão ARIA. */
      case 'ArrowRight':
        destino = (indice + 1 + itens.length) % itens.length;
        break;
      case 'ArrowLeft':
        destino = (indice - 1 + itens.length) % itens.length;
        break;
      case 'Home':
        destino = 0;
        break;
      case 'End':
        destino = itens.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    const alvo = itens[destino];
    if (!alvo) return;

    aoMudar(alvo.id);
    /* O foco acompanha a seleção — sem isso a próxima seta partiria do item
       antigo e a navegação andaria de lado. */
    trilho.current?.querySelector<HTMLButtonElement>(`[data-id="${alvo.id}"]`)?.focus();
  };

  /** `tabIndex` de cada botão: 0 no ativo, −1 nos outros. */
  const tabIndexDe = (id: string) => (id === ativa ? 0 : -1);

  return { trilho, aoTeclar, tabIndexDe };
}

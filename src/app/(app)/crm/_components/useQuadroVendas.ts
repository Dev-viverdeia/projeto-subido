'use client';

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type MouseEvent,
} from 'react';
import {
  interpretarQuadro,
  lerQuadro,
  observarQuadro,
  salvarQuadro,
  type EstadoQuadro,
  type FaseQuadro,
} from '@/lib/crm/quadro-local';

const noServidor = () => '';
const observarMontagem = () => () => {};
const noCliente = () => true;
const antesDaMontagem = () => false;

export function useQuadroVendas(contaId: string) {
  // O HTML inicial não pode aceitar uma busca antes de os handlers assumirem o campo.
  const pronto = useSyncExternalStore(observarMontagem, noCliente, antesDaMontagem);
  const snapshot = useCallback(() => lerQuadro(contaId), [contaId]);
  const raw = useSyncExternalStore(observarQuadro, snapshot, noServidor);
  const estado = useMemo(() => interpretarQuadro(raw), [raw]);
  const raiz = useRef<HTMLDivElement>(null);
  const saindo = useRef(false);

  const atualizar = useCallback(
    (mudancas: Partial<EstadoQuadro>) => {
      salvarQuadro(contaId, { ...interpretarQuadro(lerQuadro(contaId)), ...mudancas });
    },
    [contaId],
  );

  function guardarSaida(evento: MouseEvent<HTMLDivElement>) {
    // Ctrl/Cmd e nova aba não tiram o usuário do quadro atual.
    if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey)
      return;
    const link = (evento.target as Element).closest<HTMLAnchorElement>('a[href]');
    const card = link?.closest<HTMLElement>('[data-venda-id]');
    if (!link || !card || link.target === '_blank' || link.origin !== window.location.origin)
      return;
    saindo.current = true;
    const fase = card.closest<HTMLElement>('[data-fase]')?.dataset.fase as FaseQuadro | undefined;
    atualizar({
      ...(fase ? { fase } : {}),
      retorno: {
        id: card.dataset.vendaId!,
        href: link.pathname + link.search,
        topo: card.getBoundingClientRect().top,
      },
    });
  }

  useLayoutEffect(() => {
    const retorno = estado.retorno;
    if (!retorno || !raiz.current || saindo.current) return;
    // Restaurar depois de o Next trocar o loading pela lista real. Sem observar cada scroll.
    const frame = requestAnimationFrame(() => {
      const quadro = raiz.current;
      if (!quadro) return;
      const card = [...quadro.querySelectorAll<HTMLElement>('[data-venda-id]')].find(
        (el) => el.dataset.vendaId === retorno.id,
      );
      const fase = card?.closest<HTMLElement>('[data-fase]')?.dataset.fase as
        FaseQuadro | undefined;
      if (fase && fase !== estado.fase) {
        atualizar({ fase });
        return;
      }
      const visivel = card && card.getClientRects().length > 0;
      const link = visivel
        ? [...card.querySelectorAll<HTMLAnchorElement>('a[href]')].find(
            (el) => el.pathname + el.search === retorno.href,
          )
        : null;
      if (visivel) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + card.getBoundingClientRect().top - retorno.topo),
          behavior: 'instant',
        });
        (link ?? card.querySelector<HTMLElement>('a, button'))?.focus({ preventScroll: true });
        if (
          link &&
          (link.getBoundingClientRect().bottom > window.innerHeight ||
            link.getBoundingClientRect().top < 0)
        ) {
          link.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      } else {
        // Oportunidade removida ou fora do filtro: manter as escolhas e um foco utilizável.
        quadro.scrollIntoView({ block: 'start', behavior: 'instant' });
        quadro
          .querySelector<HTMLElement>('button[aria-pressed="true"]')
          ?.focus({ preventScroll: true });
      }
      atualizar({ retorno: null });
    });
    return () => cancelAnimationFrame(frame);
  }, [estado.retorno, estado.fase, atualizar]);

  return { estado, atualizar, raiz, guardarSaida, pronto };
}

/**
 * Label roll — o rótulo sobe na janela quando o pai recebe hover ou foco.
 *
 * Todo item interativo da referência faz isto, e é o que faz a interface parecer
 * construída em vez de estilizada. Custa zero JavaScript: o clone é estático e a
 * transição mora no CSS, disparada pelo `:hover`/`:focus-visible` do <a>/<button>
 * ancestral.
 *
 * O clone leva `aria-hidden` — é ornamento, e um leitor de tela não deve ouvir o
 * rótulo duas vezes.
 */
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="roll__track">
        <span className="roll__item">{children}</span>
        <span className="roll__item" aria-hidden="true">
          {children}
        </span>
      </span>
    </span>
  );
}

'use client';

import styles from './BuscaCatalogo.module.css';

/* Glifos inline (10–15px): três paths não justificam arrastar biblioteca de
   ícones para o bundle do cliente — a regra do repo é lucide só em Server
   Component. */
function Lupa() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Xis() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="m1.5 1.5 7 7m0-7-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BuscaCatalogo({
  valor,
  aoMudar,
  placeholder,
}: {
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder: string;
}) {
  return (
    <div className={styles.caixa}>
      <span className={styles.lupa}>
        <Lupa />
      </span>
      <input
        type="search"
        className={styles.campo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {valor && (
        <button
          type="button"
          className={styles.limpar}
          onClick={() => aoMudar('')}
          aria-label="Limpar busca"
        >
          <Xis />
        </button>
      )}
    </div>
  );
}

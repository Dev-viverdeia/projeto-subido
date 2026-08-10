import styles from './CarregandoDado.module.css';

/** Reserva a linha do dado assíncrono sem inserir copy temporária no meio da tela. */
export function CarregandoDado({ largura = '14ch' }: { largura?: string }) {
  return (
    <span className={styles.estado} style={{ ['--largura-dado' as string]: largura }}>
      <span className={styles.barra} aria-hidden="true" />
      <span className="sr-only">Carregando informação</span>
    </span>
  );
}

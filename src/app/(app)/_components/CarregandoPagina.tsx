import styles from './CarregandoPagina.module.css';

/** Estado instantâneo para navegações que ainda aguardam dados do servidor. */
export function CarregandoPagina() {
  return (
    <div className={styles.pagina} role="status" aria-live="polite" aria-label="Carregando página">
      <span className="sr-only">Carregando os dados desta página.</span>

      <header className={styles.cabecalho} aria-hidden="true">
        <div className={`${styles.esqueleto} ${styles.sobretitulo}`} />
        <div className={`${styles.esqueleto} ${styles.titulo}`} />
        <div className={`${styles.esqueleto} ${styles.descricao}`} />
      </header>

      <div className={styles.grade} aria-hidden="true">
        <section className={`${styles.cartao} ${styles.cartaoPrincipal}`}>
          <div className={styles.linhaCartao}>
            <div className={`${styles.esqueleto} ${styles.icone}`} />
            <div className={styles.textos}>
              <div className={`${styles.esqueleto} ${styles.textoMedio}`} />
              <div className={`${styles.esqueleto} ${styles.textoCurto}`} />
            </div>
          </div>
          <div className={`${styles.esqueleto} ${styles.bloco}`} />
        </section>

        <section className={styles.cartao}>
          <div className={`${styles.esqueleto} ${styles.textoMedio}`} />
          <div className={`${styles.esqueleto} ${styles.textoLongo}`} />
          <div className={`${styles.esqueleto} ${styles.textoCurto}`} />
        </section>

        <section className={styles.cartao}>
          <div className={`${styles.esqueleto} ${styles.textoCurto}`} />
          <div className={`${styles.esqueleto} ${styles.textoLongo}`} />
          <div className={`${styles.esqueleto} ${styles.textoMedio}`} />
        </section>
      </div>
    </div>
  );
}

import styles from '../pagina.module.css';

/** Hero operacional compartilhada por produção e preview visual. */
export function HeroProspeccao({ saldo }: { saldo: number }) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroPrincipal}>
        <h1>Prospecção</h1>
        <p>Encontre empresas por segmento e região.</p>
      </div>

      <aside role="complementary" className={styles.heroSaldo} aria-label="Créditos de prospecção">
        <div className={styles.heroSaldoRotulo}>
          <span>Saldo</span>
        </div>
        <div className={styles.heroSaldoValor}>
          <strong>{saldo}</strong>
          <span>créditos</span>
        </div>
      </aside>
    </header>
  );
}

import { Coins } from 'lucide-react';
import styles from '../pagina.module.css';

/** Hero operacional compartilhada por produção e preview visual. */
export function HeroProspeccao({ saldo }: { saldo: number }) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroPrincipal}>
        <p className={styles.sobretitulo}>Prospecção guiada</p>
        <h1>Crie listas que já chegam prontas para uma abordagem.</h1>
        <p>
          Você define o mercado e a região. A plataforma reúne os canais públicos, organiza
          possíveis decisores e deixa você escolher o que merece virar oportunidade.
        </p>
        <ol className={styles.heroFluxo} aria-label="Fluxo da prospecção">
          <li>
            <span>01</span>
            <strong>Encontrar empresas</strong>
          </li>
          <li>
            <span>02</span>
            <strong>Reunir sinais</strong>
          </li>
          <li>
            <span>03</span>
            <strong>Escolher oportunidades</strong>
          </li>
        </ol>
      </div>

      <aside className={styles.heroSaldo} aria-label="Créditos de prospecção">
        <div className={styles.heroSaldoRotulo}>
          <Coins size={18} strokeWidth={1.7} aria-hidden="true" />
          <span>Capacidade disponível</span>
        </div>
        <strong>{saldo}</strong>
        <p>empresas podem ser qualificadas agora</p>
        <small>1 empresa encontrada consome 1 crédito</small>
      </aside>
    </header>
  );
}

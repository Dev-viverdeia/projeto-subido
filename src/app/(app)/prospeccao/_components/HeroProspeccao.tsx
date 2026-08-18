import { Coins } from 'lucide-react';
import { Card, Pill } from '@/design-system/via';
import styles from '../pagina.module.css';

/** Hero operacional compartilhada por produção e preview visual. */
export function HeroProspeccao({ saldo }: { saldo: number }) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroPrincipal}>
        <p className={styles.sobretitulo}>Prospecção</p>
        <h1>Encontre empresas para prospectar.</h1>
        <p>
          Escolha o segmento e a região. A busca reúne telefone, e-mail, site, redes sociais e
          possíveis decisores em uma lista.
        </p>
      </div>

      <Card
        as="div"
        role="complementary"
        variant="atmospheric"
        className={styles.heroSaldo}
        aria-label="Créditos de prospecção"
      >
        <div className={styles.heroSaldoRotulo}>
          <Coins size={18} strokeWidth={1.7} aria-hidden="true" />
          <span>Créditos disponíveis</span>
        </div>
        <div className={styles.heroSaldoValor}>
          <strong>{saldo}</strong>
          <span>empresas</span>
        </div>
        <Pill size="sm" variant="default">
          1 crédito por empresa encontrada
        </Pill>
      </Card>
    </header>
  );
}

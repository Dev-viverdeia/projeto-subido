import { Link2Off } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from './AcessoIndisponivel.module.css';

const TITULOS = {
  proposta: 'Proposta indisponível',
  portal: 'Link do projeto indisponível',
  sala: 'Convite indisponível',
};

/** Não distingue um segredo revogado de um endereço que nunca existiu. */
export function AcessoIndisponivel({ tipo }: { tipo: keyof typeof TITULOS }) {
  return (
    <main className={styles.pagina}>
      <header className={styles.marca}>
        <SubidoLogo size={18} />
      </header>
      <section className={styles.cartao} aria-labelledby="acesso-titulo">
        <span className={styles.icone} aria-hidden="true">
          <Link2Off size={28} strokeWidth={1.6} />
        </span>
        <h1 id="acesso-titulo">{TITULOS[tipo]}</h1>
        <p>O endereço pode estar incompleto ou ter sido desativado.</p>
        <div className={styles.orientacao}>Peça um novo link à pessoa que enviou o convite.</div>
      </section>
    </main>
  );
}

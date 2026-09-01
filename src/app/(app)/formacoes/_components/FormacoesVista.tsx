import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import entrada from '../../_components/entrada.module.css';
import { TrilhaFormacoes } from './TrilhaFormacoes';
import styles from '../pagina.module.css';

export function FormacoesVista({ formacoes }: { formacoes: FormacaoResumo[] }) {
  return (
    <div className={styles.pagina}>
      <section className={`${styles.hero} ${entrada.bloco}`} aria-labelledby="formacoes-titulo">
        <div className={styles.heroTexto}>
          <p className={styles.eyebrow}>Formações</p>
          <h1 id="formacoes-titulo" className={styles.titulo}>
            Aprenda. Aplique no trabalho.
          </h1>
          <p className={styles.descricao}>
            Escolha uma formação e avance uma aula por vez. Seu progresso fica salvo na conta.
          </p>
        </div>

        <Link href="/solucoes" className={styles.atalhoProjetos}>
          <span>Quer implementar para um cliente?</span>
          <strong>
            Ver projetos
            <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </strong>
        </Link>
      </section>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <TrilhaFormacoes formacoes={formacoes} />
      </div>
    </div>
  );
}

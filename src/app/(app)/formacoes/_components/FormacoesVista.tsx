import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import entrada from '../../_components/entrada.module.css';
import { TrilhaFormacoes } from './TrilhaFormacoes';
import styles from '../pagina.module.css';

export function FormacoesVista({ formacoes }: { formacoes: FormacaoResumo[] }) {
  return (
    <div className={styles.pagina}>
      <header className={`${styles.hero} ${entrada.bloco}`}>
        <div className={styles.heroTexto}>
          <h1 id="formacoes-titulo" className={styles.titulo}>
            Formações
          </h1>
          <p className={styles.descricao}>Aprenda as ferramentas para trabalhar com IA.</p>
        </div>

        <Link href="/solucoes" className={styles.atalhoProjetos}>
          Ver projetos
          <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </header>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <TrilhaFormacoes formacoes={formacoes} />
      </div>
    </div>
  );
}

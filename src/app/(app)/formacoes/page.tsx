import type { Metadata } from 'next';
import { listarFormacoes } from '@/lib/conteudo/queries';
import entrada from '../_components/entrada.module.css';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TrilhaFormacoes } from './_components/TrilhaFormacoes';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Formações' };

export default async function FormacoesPage() {
  const formacoes = await listarFormacoes();

  return (
    <div className={styles.pagina}>
      <section className={`${styles.hero} ${entrada.bloco}`} aria-labelledby="formacoes-titulo">
        <div className={styles.heroTexto}>
          <p className={styles.eyebrow}>Desenvolvimento profissional</p>
          <h1 id="formacoes-titulo" className={styles.titulo}>
            Aprenda a trabalhar com IA.
          </h1>
          <p className={styles.descricao}>
            Formações desenvolvem suas habilidades. Projetos mostram como transformar essas
            habilidades em uma entrega para o cliente.
          </p>
          <div className={styles.acoes}>
            <Link href="#trilha-formacoes" className={styles.acaoPrimaria}>
              Ver trilha profissional
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <Link href="/solucoes" className={styles.acaoSecundaria}>
              Ver projetos
            </Link>
          </div>
        </div>

        <dl className={styles.diferenca} aria-label="Como usar Formações e Projetos">
          <div>
            <dt>Formações</dt>
            <dd>Aprender ferramentas e desenvolver repertório profissional.</dd>
          </div>
          <div>
            <dt>Projetos</dt>
            <dd>Seguir um método e concluir uma entrega com um cliente.</dd>
          </div>
        </dl>
      </section>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <TrilhaFormacoes formacoes={formacoes} />
      </div>
    </div>
  );
}

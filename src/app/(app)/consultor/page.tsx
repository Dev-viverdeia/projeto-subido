import type { Metadata } from 'next';
import Link from 'next/link';
import { listarThreads } from '@/lib/consultor/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { HistoricoDropdown } from '../_components/HistoricoDropdown';
import entrada from '../_components/entrada.module.css';
import { Conversa } from './_components/Conversa';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Consultor' };

/**
 * O CONSULTOR — a tela inicial é a pergunta, como no Builder.
 *
 * A conversa mora em /consultor/[id]: a primeira mensagem cria a thread na Edge
 * Function e a navegação leva para a URL dela — fechar a aba não perde nada.
 * As conversas anteriores ficam no dropdown do canto, o mesmo componente do
 * histórico do Builder.
 */
export default async function ConsultorPage() {
  const threads = await listarThreads();

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Consultor" oculto />

      {threads.length > 0 ? (
        <div className={`${entrada.bloco} ${styles.topoDireito}`}>
          <HistoricoDropdown total={threads.length}>
            <ul className={styles.threads}>
              {threads.map((t, indice) => (
                <li key={t.id} style={{ '--i': indice } as React.CSSProperties}>
                  <Link href={`/consultor/${t.id}`} className={styles.thread}>
                    {t.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </HistoricoDropdown>
        </div>
      ) : null}

      <div className={`${entrada.bloco} ${styles.tela}`}>
        <header className={styles.cabecalho}>
          <p className={styles.eyebrow}>Consultor</p>
          <h2 className={styles.titulo}>
            Qual é a <em>dúvida</em> do momento?
          </h2>
          <p className={styles.apoio}>
            Contexto do seu caso, caminho de implementação, qual solução do catálogo serve.{' '}
            <em>Uma pergunta por vez funciona melhor.</em>
          </p>
        </header>

        <Conversa />
      </div>
    </div>
  );
}

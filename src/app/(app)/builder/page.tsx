import type { Metadata } from 'next';
import { Blocks } from 'lucide-react';
import { EmptyState } from '@/design-system/via';
import { chaveDoModelo } from '@/lib/env';
import { listarSolucoesDoBuilder } from '@/lib/builder/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import entrada from '../_components/entrada.module.css';
import { Compositor } from './_components/Compositor';
import { HistoricoBuilder } from './_components/HistoricoBuilder';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Builder' };

/**
 * Pilar 03 — o implementador descreve a ideia do cliente e recebe o projeto.
 *
 * A tela tem dois momentos e nenhum a mais: COMPOR (a banda escura) e RELER (o
 * histórico). A entrevista e o documento moram em `/builder/[id]` porque a linha
 * já existe no banco quando as perguntas voltam — a URL passa a ser o estado, e
 * fechar a aba no meio deixa de perder o trabalho.
 *
 * `chaveDoModelo()` é lido AQUI, no servidor, e desce como booleano. A chave nunca
 * atravessa a fronteira; o que atravessa é o fato de ela existir — o suficiente
 * para a tela dizer a verdade antes de aceitar a ideia.
 */
export default async function BuilderPage() {
  const [itens, temChave] = [await listarSolucoesDoBuilder(), chaveDoModelo() !== null];

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Builder" oculto />

      <div className={entrada.bloco}>
        <Compositor temChave={temChave} />
      </div>

      <section className={`${entrada.bloco} ${entrada.atraso1} ${styles.historico}`}>
        <div className={styles.tituloSecao}>
          <h2 className={styles.eyebrow}>
            Projetos
            {itens.length > 0 ? <span className={styles.total}>{itens.length}</span> : null}
          </h2>
        </div>

        {itens.length > 0 ? (
          <HistoricoBuilder itens={itens} />
        ) : (
          <EmptyState
            icon={<Blocks size={20} strokeWidth={1.8} />}
            title="Nenhum projeto ainda"
            description="O primeiro projeto aparece aqui assim que você descrever uma ideia acima."
          />
        )}
      </section>
    </div>
  );
}

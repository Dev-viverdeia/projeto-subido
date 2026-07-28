import type { Metadata } from 'next';
import { chaveDoModelo } from '@/lib/env';
import { listarSolucoesDoBuilder } from '@/lib/builder/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import entrada from '../_components/entrada.module.css';
import { Compositor } from './_components/Compositor';
import { HistoricoBuilder } from './_components/HistoricoBuilder';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Builder' };

/**
 * Pilar 03 — o implementador descreve o problema do cliente e recebe o projeto.
 *
 * A TELA INICIAL É SÓ O COMPOSITOR. A entrevista e o documento moram em
 * `/builder/[id]` porque a linha já existe no banco quando as perguntas voltam:
 * a URL passa a ser o estado, e fechar a aba no meio deixa de perder o trabalho.
 *
 * O HISTÓRICO SÓ APARECE QUANDO EXISTE. Um `EmptyState` embaixo do compositor
 * diria "nenhum projeto ainda" para quem está olhando o campo onde se cria o
 * primeiro — ocupa a dobra para não informar nada. Sem projetos, a pergunta fica
 * sozinha na tela, que é o estado certo para uma tela de criação.
 *
 * `chaveDoModelo()` é lido AQUI, no servidor, e desce como booleano. A chave nunca
 * atravessa a fronteira; o que atravessa é o fato de ela existir — o suficiente
 * para a tela dizer a verdade antes de aceitar a ideia.
 */
export default async function BuilderPage() {
  const itens = await listarSolucoesDoBuilder();
  const temChave = chaveDoModelo() !== null;

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Builder" oculto />

      <div className={entrada.bloco}>
        <Compositor temChave={temChave} />
      </div>

      {itens.length > 0 ? (
        <section className={`${entrada.bloco} ${entrada.atraso1} ${styles.historico}`}>
          <h2 className={styles.eyebrow}>
            Seus projetos
            <span className={styles.total}>{itens.length}</span>
          </h2>

          <HistoricoBuilder itens={itens} />
        </section>
      ) : null}
    </div>
  );
}

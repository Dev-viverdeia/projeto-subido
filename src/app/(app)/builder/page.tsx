import type { Metadata } from 'next';
import { listarSolucoesDoBuilder } from '@/lib/builder/queries';
import { obterSolucao } from '@/lib/conteudo/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import entrada from '../_components/entrada.module.css';
import { Compositor } from './_components/Compositor';
import { HistoricoBuilder } from './_components/HistoricoBuilder';
import { HistoricoDropdown } from '../_components/HistoricoDropdown';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Estúdio' };

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
 * A CHAVE DO MODELO NÃO É CONFERIDA AQUI. Ela vive nos secrets do Supabase e é
 * lida dentro da Edge Function; o processo do Next não enxerga aquele cofre. A
 * ausência aparece na primeira chamada, com o nome do secret na mensagem.
 */
export default async function BuilderPage({ searchParams }: PageProps<'/builder'>) {
  const params = await searchParams;
  const projetoParam = Array.isArray(params.projeto) ? params.projeto[0] : params.projeto;
  const [itens, projeto] = await Promise.all([
    listarSolucoesDoBuilder(),
    projetoParam ? obterSolucao(projetoParam) : Promise.resolve(null),
  ]);
  const origem = projeto?.projeto
    ? {
        slug: projeto.slug,
        titulo: projeto.titulo,
        resumo: projeto.resumo,
        resultado: projeto.projeto.resultado,
      }
    : null;

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Estúdio" oculto />

      {/* O histórico mora no CANTO SUPERIOR direito, sobreposto: um gatilho
          compacto que abre o painel por cima da tela. A grade continua
          server-rendered e atravessa como children — o dropdown só abre e
          fecha. Sem projetos, nem o gatilho aparece. */}
      {itens.length > 0 ? (
        <div className={`${entrada.bloco} ${styles.topoDireito}`}>
          <HistoricoDropdown total={itens.length}>
            <HistoricoBuilder itens={itens} />
          </HistoricoDropdown>
        </div>
      ) : null}

      <div className={entrada.bloco}>
        <Compositor origem={origem} />
      </div>
    </div>
  );
}

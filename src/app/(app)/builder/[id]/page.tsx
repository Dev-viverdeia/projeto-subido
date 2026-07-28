import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pill } from '@/design-system/via';
import { apagarSolucao } from '@/lib/builder/actions';
import { paraMarkdown } from '@/lib/builder/markdown';
import { obterSolucaoDoBuilder } from '@/lib/builder/queries';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import entrada from '../../_components/entrada.module.css';
import { BotaoExcluir } from '../../admin/_components/BotaoExcluir';
import { Entrevista } from '../_components/Entrevista';
import { EstadoGeracao } from '../_components/EstadoGeracao';
import { FichaProjeto } from '../_components/FichaProjeto';
import { ROTULO_STATUS, VARIANTE_STATUS } from '../_components/statusBuilder';
import styles from './pagina.module.css';

/**
 * Um projeto do Builder — e os quatro estados em que ele pode estar.
 *
 * A URL É O ESTADO. O rascunho existe no banco desde que as perguntas voltaram,
 * então recarregar, fechar a aba ou abrir em outro dispositivo cai exatamente no
 * ponto em que a pessoa parou. Nenhum passo do fluxo vive só na memória do
 * cliente.
 *
 * `falhou` VOLTA PARA A ENTREVISTA, não para uma tela de erro sem saída: as
 * respostas continuam gravadas, e a ação certa depois de uma falha é gerar de
 * novo — não redigitar tudo.
 *
 * O MARKDOWN É MONTADO NO SERVIDOR. Serializar no cliente arrastaria a função
 * inteira para o bundle por causa de um botão; aqui o custo é uma string que já
 * viaja no payload do RSC.
 */
export async function generateMetadata({ params }: PageProps<'/builder/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const solucao = await obterSolucaoDoBuilder(id);
  return { title: solucao?.titulo || 'Projeto' };
}

export default async function ProjetoDoBuilderPage({ params }: PageProps<'/builder/[id]'>) {
  const { id } = await params;
  const solucao = await obterSolucaoDoBuilder(id);

  if (!solucao) notFound();

  return (
    <div className={styles.pagina}>
      <div className={styles.topo}>
        <BotaoVoltar fallback="/builder" rotulo="Builder" />

        <div className={styles.acoes}>
          <Pill variant={VARIANTE_STATUS[solucao.status]} size="sm">
            {ROTULO_STATUS[solucao.status]}
          </Pill>

          {solucao.documento ? (
            <BotaoCopiar
              texto={paraMarkdown(solucao.documento)}
              rotuloDoQue="o projeto inteiro em Markdown"
            />
          ) : null}

          <BotaoExcluir
            id={solucao.id}
            acao={apagarSolucao}
            descricao="Apagar este projeto é definitivo: não há lixeira nem cópia em outra tela. A ideia original e as respostas da entrevista vão junto."
          />
        </div>
      </div>

      <div className={entrada.bloco}>
        {solucao.status === 'gerando' ? <EstadoGeracao id={solucao.id} /> : null}

        {solucao.status === 'falhou' && solucao.erro ? (
          <p className={styles.falha} role="alert">
            <span className={styles.falhaRotulo}>A geração anterior falhou</span>
            {solucao.erro}
          </p>
        ) : null}

        {solucao.status === 'rascunho' || solucao.status === 'falhou' ? (
          <Entrevista id={solucao.id} ideia={solucao.ideiaOriginal} perguntas={solucao.respostas} />
        ) : null}

        {solucao.status === 'pronta' && solucao.documento ? (
          <FichaProjeto
            documento={solucao.documento}
            criadoEm={solucao.criadoEm}
            modelo={solucao.modelo}
          />
        ) : null}

        {/* JSONB gravado por uma versão anterior do schema. Dizer isso é melhor
            que renderizar meio documento e deixar o resto sumir em silêncio. */}
        {solucao.status === 'pronta' && solucao.documentoIlegivel ? (
          <p className={styles.falha} role="alert">
            <span className={styles.falhaRotulo}>Documento em formato antigo</span>
            Este projeto foi gravado num formato que a versão atual da tela não sabe exibir. Gere de
            novo a partir da mesma ideia.
          </p>
        ) : null}
      </div>
    </div>
  );
}

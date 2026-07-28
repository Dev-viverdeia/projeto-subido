import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pill } from '@/design-system/via';
import { obterSolucaoDoBuilder } from '@/lib/builder/queries';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import entrada from '../../_components/entrada.module.css';
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
        <Pill variant={VARIANTE_STATUS[solucao.status]} size="sm">
          {ROTULO_STATUS[solucao.status]}
        </Pill>
      </div>

      <div className={entrada.bloco}>
        {solucao.status === 'gerando' ? <EstadoGeracao /> : null}

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

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pill } from '@/design-system/via';
import { apagarSolucao } from '@/lib/builder/actions';
import { paraMarkdown } from '@/lib/builder/markdown';
import { obterSolucaoDoBuilder } from '@/lib/builder/queries';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import entrada from '../../_components/entrada.module.css';
import { BotaoExcluir } from '../../admin/_components/BotaoExcluir';
import { Entrevista } from '../_components/Entrevista';
import { EntenderProjeto } from '../_components/sala/EntenderProjeto';
import { EtapaCriacao } from '../_components/sala/EtapaCriacao';
import { EtapaKit } from '../_components/sala/EtapaKit';
import { Kanban } from '../_components/sala/Kanban';
import { SalaDoProjeto } from '../_components/sala/SalaDoProjeto';
import { ROTULO_STATUS, VARIANTE_STATUS } from '../_components/statusBuilder';
import { DefinirTrilha } from '../../_components/trilha/contexto';
import styles from './pagina.module.css';

/**
 * Um projeto do Estúdio — e os quatro estados em que ele pode estar.
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

  /* A SALA usa a largura larga; entrevista, espera e falha usam a coluna.
     `gerando` entrou no lado largo porque a sala JÁ abre na geração — medido a
     1920: com a coluna de 760 o hero virava uma torre e os três cards da criação
     ficavam abaixo da dobra. A condição segue o que RENDERIZA (a sala), não um
     status solto. */
  const emColuna = !(solucao.status === 'gerando' || solucao.status === 'pronta');

  return (
    <div className={styles.pagina} data-coluna={emColuna ? '' : undefined}>
      {/* Enquanto a entrevista não terminou não existe título — o modelo só o
          escreve junto com o documento. A ideia original é o que a pessoa
          reconhece, e é ela que vai para o degrau atual até lá. */}
      <DefinirTrilha
        voltarPara="/builder"
        voltarRotulo="Estúdio"
        atual={solucao.titulo || solucao.ideiaOriginal}
      />

      {/* Sem botão "voltar": a trilha do cabeçalho já traz `‹ Estúdio`. Esta era
          a última tela de detalhe com os dois controles de retorno a 40px um do
          outro — soluções, curso e aula já tinham perdido o seu. */}
      <div className={styles.topo}>
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
        {solucao.status === 'falhou' && solucao.erro ? (
          <p className={styles.falha} role="alert">
            <span className={styles.falhaRotulo}>A geração anterior falhou</span>
            {solucao.erro}
          </p>
        ) : null}

        {solucao.status === 'rascunho' || solucao.status === 'falhou' ? (
          <Entrevista id={solucao.id} ideia={solucao.ideiaOriginal} perguntas={solucao.respostas} />
        ) : null}

        {/* A SALA substitui a ficha corrida. O mesmo material, quebrado em quatro
            momentos — cada um respondendo uma pergunta diferente. Os painéis são
            montados AQUI, no servidor, e entram na ilha como `ReactNode`: assim o
            documento inteiro não atravessa a fronteira como prop serializada. */}
        {/* A SALA ABRE JÁ NA GERAÇÃO, como no print: etapa 1 ativa e as outras com
            cadeado. Antes a espera era um card flutuante que sumia e dava lugar à
            sala — duas telas para um momento só, com um salto no meio. Agora o
            percurso é o mesmo desde o início; o que muda é quanto dele está
            aberto. */}
        {solucao.status === 'gerando' || (solucao.status === 'pronta' && solucao.documento) ? (
          <SalaDoProjeto
            solucao={solucao}
            criacao={<EtapaCriacao id={solucao.id} documento={solucao.documento} />}
            /* Travados enquanto não há documento — ver `motivoDoCadeado`. O `null`
               aqui nunca chega à tela: o cadeado substitui o painel. */
            entender={
              /* Painel FOCADO, não a ficha inteira: a ficha repetia o título do
                 hero e duplicava etapas (Construir), prompts e ferramentas (Kit).
                 Aqui fica só o que responde "o que é isto e por quê". */
              solucao.documento ? <EntenderProjeto documento={solucao.documento} /> : null
            }
            kit={
              solucao.documento ? (
                <EtapaKit id={solucao.id} documento={solucao.documento} stack={solucao.stack} />
              ) : null
            }
            construir={
              solucao.documento ? (
                <Kanban
                  id={solucao.id}
                  etapas={solucao.documento.etapas}
                  tarefas={solucao.tarefas}
                />
              ) : null
            }
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

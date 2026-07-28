import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterSolucao } from '@/lib/conteudo/queries';
import { ROTULOS } from '@/lib/routes';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import { VideoConteudo } from '../../_components/VideoConteudo';
import entrada from '../../_components/entrada.module.css';
import { Ferramentas, Prompts } from '../_components/KitSolucao';
import { PassoAPasso } from '../_components/PassoAPasso';
import styles from './pagina.module.css';

/* `obterSolucao` é `cache()`-ada: esta chamada e a da página são UMA ida ao banco. */
export async function generateMetadata({
  params,
}: PageProps<'/solucoes/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const solucao = await obterSolucao(slug);
  return { title: solucao?.titulo ?? 'Solução' };
}

/**
 * Detalhe da solução — a ficha de implementação.
 *
 * COMPOSIÇÃO: cabeçalho claro, vídeo abrindo a coluna principal, passo a passo
 * abaixo dele e o kit (ferramentas + prompts) fixo à direita.
 *
 * A LARGURA É QUE FAZ ESTA TELA FUNCIONAR, não a estrutura. Ela nasceu em 1280
 * (vídeo com 488px de altura) e quebrou quando o canvas da área logada subiu para
 * 1600: o vídeo foi para 668px e empurrou o primeiro passo para fora da dobra.
 * A correção é a medida — esta é uma tela de LEITURA (vídeo + passos + kit), não
 * uma grade, e pela regra do CLAUDE.md não acompanha o canvas.
 */
export default async function SolucaoPage({ params }: PageProps<'/solucoes/[slug]'>) {
  const { slug } = await params;
  const solucao = await obterSolucao(slug);
  if (!solucao) notFound();

  const etapas = solucao.itens.filter((i) => i.tipo === 'etapa');
  const ferramentas = solucao.itens.filter((i) => i.tipo === 'ferramenta');
  const prompts = solucao.itens.filter((i) => i.tipo === 'prompt');

  /* Só entra o que EXISTE — contagem zero não vira "0 ferramentas". */
  const meta = [
    etapas.length > 0 && `${etapas.length} ${etapas.length === 1 ? 'etapa' : 'etapas'}`,
    ferramentas.length > 0 &&
      `${ferramentas.length} ${ferramentas.length === 1 ? 'ferramenta' : 'ferramentas'}`,
    prompts.length > 0 && `${prompts.length} ${prompts.length === 1 ? 'prompt' : 'prompts'}`,
  ].filter((v): v is string => Boolean(v));

  return (
    <div className={styles.pagina}>
      <div className={`${styles.topo} ${entrada.bloco}`}>
        <BotaoVoltar fallback="/solucoes" rotulo={ROTULOS['/solucoes']} />
        {solucao.categoria && <p className={styles.eyebrow}>{solucao.categoria}</p>}
      </div>

      <header className={`${styles.cabecalho} ${entrada.bloco} ${entrada.atraso1}`}>
        <h1 className={styles.titulo}>{solucao.titulo}</h1>
        {solucao.resumo && <p className={styles.resumo}>{solucao.resumo}</p>}
        {meta.length > 0 && <p className={styles.meta}>{meta.join(' · ')}</p>}
      </header>

      <div className={`${styles.grade} ${entrada.bloco} ${entrada.atraso2}`}>
        <div className={styles.principal}>
          <VideoConteudo videoUrl={solucao.video_url} titulo={solucao.titulo} />
          <PassoAPasso etapas={etapas} />
        </div>

        <aside className={styles.lateral}>
          <Ferramentas itens={ferramentas} />
          <Prompts itens={prompts} />
        </aside>
      </div>
    </div>
  );
}

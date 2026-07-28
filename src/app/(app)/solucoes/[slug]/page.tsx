import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterSolucao } from '@/lib/conteudo/queries';
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
 * Detalhe da solução — ficha de implementação.
 *
 * Grade: conteúdo principal (vídeo + passo a passo) e coluna lateral sticky
 * (ferramentas + prompts). Slug inexistente ou despublicado cai no `notFound()`
 * — rascunho responde 404, não "sem acesso" (confirmar que existe já é vazar).
 */
export default async function SolucaoPage({ params }: PageProps<'/solucoes/[slug]'>) {
  const { slug } = await params;
  const solucao = await obterSolucao(slug);
  if (!solucao) notFound();

  const etapas = solucao.itens.filter((i) => i.tipo === 'etapa');
  const ferramentas = solucao.itens.filter((i) => i.tipo === 'ferramenta');
  const prompts = solucao.itens.filter((i) => i.tipo === 'prompt');

  return (
    <div className={styles.pagina}>
      <div className={`${styles.topo} ${entrada.bloco}`}>
        <BotaoVoltar fallback="/solucoes" rotulo="Soluções" />
        {solucao.categoria && <p className={styles.eyebrow}>{solucao.categoria}</p>}
      </div>

      <header className={`${styles.cabecalho} ${entrada.bloco} ${entrada.atraso1}`}>
        <h1 className={styles.titulo}>{solucao.titulo}</h1>
        {solucao.resumo && <p className={styles.resumo}>{solucao.resumo}</p>}
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

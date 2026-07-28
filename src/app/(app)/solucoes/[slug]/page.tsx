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
 * COMPOSIÇÃO: hero navy com o vídeo AO LADO, passo a passo abaixo.
 *
 * A versão anterior empilhava vídeo e passos numa coluna de 1188px: o vídeo 16:9
 * ficava com 668px de altura e empurrava o primeiro passo para baixo da dobra —
 * numa tela cujo produto É o passo a passo. E era a única tela da plataforma sem
 * nenhuma superfície escura, então não tinha âncora.
 *
 * Agora o vídeo divide o hero com o argumento (a mesma composição do hero da
 * landing) e cabe em ~340px de altura; os passos abrem o corpo da página.
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
      <div className={entrada.bloco}>
        <BotaoVoltar fallback="/solucoes" rotulo={ROTULOS['/solucoes']} />
      </div>

      <header
        className={`${styles.hero} via-mesh-navy via-noise ${entrada.bloco} ${entrada.atraso1}`}
      >
        <span className={styles.sheen} aria-hidden="true" />

        <div className={styles.heroTexto}>
          {solucao.categoria && <p className={styles.eyebrow}>{solucao.categoria}</p>}
          <h1 className={styles.titulo}>{solucao.titulo}</h1>
          {solucao.resumo && <p className={styles.resumo}>{solucao.resumo}</p>}
          {meta.length > 0 && <p className={styles.meta}>{meta.join(' · ')}</p>}
        </div>

        <div className={styles.heroVideo}>
          <VideoConteudo videoUrl={solucao.video_url} titulo={solucao.titulo} tom="sobreEscuro" />
        </div>
      </header>

      <div className={`${styles.corpo} ${entrada.bloco} ${entrada.atraso2}`}>
        <div className={styles.principal}>
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

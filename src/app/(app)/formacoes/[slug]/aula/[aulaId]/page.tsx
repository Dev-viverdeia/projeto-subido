import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterAula } from '@/lib/conteudo/queries';
import { BotaoVoltar } from '../../../../_components/BotaoVoltar';
import { VideoConteudo } from '../../../../_components/VideoConteudo';
import { formatarDuracao } from '../../../../_components/tempo';
import entrada from '../../../../_components/entrada.module.css';
import { NavAula } from '../../../_components/NavAula';
import { PlaylistAula } from '../../../_components/PlaylistAula';
import styles from './pagina.module.css';

export async function generateMetadata({
  params,
}: PageProps<'/formacoes/[slug]/aula/[aulaId]'>): Promise<Metadata> {
  const { slug, aulaId } = await params;
  const contexto = await obterAula(slug, aulaId);
  return { title: contexto ? `${contexto.aula.titulo} · ${contexto.formacao.titulo}` : 'Aula' };
}

/**
 * A tela da aula. O header vive FORA do grid de propósito: assim o topo do card
 * da playlist alinha com o topo do vídeo — detalhe herdado da referência que
 * separa "montado" de "composto".
 */
export default async function AulaPage({ params }: PageProps<'/formacoes/[slug]/aula/[aulaId]'>) {
  const { slug, aulaId } = await params;
  const contexto = await obterAula(slug, aulaId);
  if (!contexto) notFound();

  const { formacao, aula, modulo, anterior, proxima, posicao, total } = contexto;
  const duracao = formatarDuracao(aula.duracao_seg);

  return (
    <div className={styles.pagina}>
      <header className={`${styles.cabecalho} ${entrada.bloco}`}>
        <div className={styles.navegacao}>
          <BotaoVoltar fallback={`/formacoes/${slug}`} rotulo="Voltar à formação" />
        </div>

        <div className={styles.textos}>
          <p className={styles.eyebrow}>
            {formacao.titulo} · {modulo.titulo}
          </p>
          <h1 className={styles.titulo}>{aula.titulo}</h1>
          <p className={styles.meta}>
            {duracao && <span>{duracao}</span>}
            {duracao && <span aria-hidden="true">·</span>}
            <span>
              Aula {posicao} de {total}
            </span>
          </p>
        </div>
      </header>

      <div className={`${styles.grade} ${entrada.bloco} ${entrada.atraso1}`}>
        <div className={styles.principal}>
          <VideoConteudo videoUrl={aula.videoUrl} titulo={aula.titulo} />
          <NavAula
            formacaoSlug={slug}
            aulaId={aula.id}
            anteriorId={anterior?.id ?? null}
            proximaId={proxima?.id ?? null}
          />
        </div>

        <PlaylistAula formacao={formacao} aulaAtualId={aula.id} />
      </div>
    </div>
  );
}

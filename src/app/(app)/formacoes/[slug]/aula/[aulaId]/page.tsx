import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterAula } from '@/lib/conteudo/queries';
import { VideoConteudo } from '../../../../_components/VideoConteudo';
import { formatarDuracao } from '../../../../_components/tempo';
import entrada from '../../../../_components/entrada.module.css';
import { NavAula } from '../../../_components/NavAula';
import { PlaylistAula } from '../../../_components/PlaylistAula';
import { DefinirTrilha } from '../../../../_components/trilha/contexto';
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
 *
 * O TOPO DIZIA A MESMA COISA TRÊS VEZES. A trilha do cabeçalho já mostra
 * `‹ Nome do curso / Módulo / Aula` em toda tela de detalhe; abaixo dela havia um
 * botão "voltar" para o mesmo curso e um eyebrow repetindo "curso · módulo".
 * Sobrou o que é só desta tela: o título da aula e a posição dela no curso.
 */
export default async function AulaPage({ params }: PageProps<'/formacoes/[slug]/aula/[aulaId]'>) {
  const { slug, aulaId } = await params;
  const contexto = await obterAula(slug, aulaId);
  if (!contexto) notFound();

  const { formacao, aula, modulo, anterior, proxima, posicao, total } = contexto;
  const duracao = formatarDuracao(aula.duracao_seg);

  return (
    <div className={styles.pagina}>
      {/* Três degraus: a volta é para o CURSO, não para o catálogo — é de onde a
          pessoa veio e para onde ela continua depois desta aula. O módulo entra
          como recorte. */}
      <DefinirTrilha
        voltarPara={`/formacoes/${slug}`}
        voltarRotulo={formacao.titulo}
        meio={modulo.titulo}
        atual={aula.titulo}
      />

      <header className={`${styles.cabecalho} ${entrada.bloco}`}>
        <div className={styles.textos}>
          <h1 className={styles.titulo}>{aula.titulo}</h1>
          {/* Pills, como na ficha de solução e no hero do curso — e só o que
              EXISTE: a duração some quando a aula não tem `duracao_seg`, em vez
              de virar "0 min". */}
          <ul className={styles.metas}>
            {duracao && <li className={styles.meta}>{duracao}</li>}
            <li className={styles.meta}>
              Aula {posicao} de {total}
            </li>
          </ul>
        </div>
      </header>

      <div className={`${styles.grade} ${entrada.bloco} ${entrada.atraso1}`}>
        <div className={styles.principal}>
          <VideoConteudo videoUrl={aula.videoUrl} titulo={aula.titulo} />
          <NavAula
            formacaoSlug={slug}
            aulaId={aula.id}
            anteriorId={anterior?.id ?? null}
            anteriorTitulo={anterior?.titulo ?? null}
            proximaId={proxima?.id ?? null}
            proximaTitulo={proxima?.titulo ?? null}
          />
        </div>

        <PlaylistAula formacao={formacao} aulaAtualId={aula.id} />
      </div>
    </div>
  );
}

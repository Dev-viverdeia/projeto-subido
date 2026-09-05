import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterAula } from '@/lib/conteudo/queries';
import { AulaConteudo } from '../../../_components/AulaConteudo';
import { DefinirTrilha } from '../../../../_components/trilha/contexto';

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

  return (
    <>
      {/* Três degraus: a volta é para o CURSO, não para o catálogo — é de onde a
          pessoa veio e para onde ela continua depois desta aula. O módulo entra
          como recorte. */}
      <DefinirTrilha
        voltarPara={`/formacoes/${slug}`}
        voltarRotulo={formacao.titulo}
        meio={modulo.titulo}
        atual={aula.titulo}
      />

      <AulaConteudo
        formacao={formacao}
        aula={aula}
        videoUrl={aula.videoUrl}
        anterior={anterior}
        proxima={proxima}
        posicao={posicao}
        total={total}
      />
    </>
  );
}

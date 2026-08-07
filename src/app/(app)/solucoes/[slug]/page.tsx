import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterProximaSolucao, obterSolucao } from '@/lib/conteudo/queries';
import { VideoConteudo } from '../../_components/VideoConteudo';
import entrada from '../../_components/entrada.module.css';
import { ICONES_CATEGORIAS, ICONE_CATEGORIA_PADRAO } from '../../_components/iconesCategorias';
import { DefinirTrilha } from '../../_components/trilha/contexto';
import { FichaSolucao } from '../_components/FichaSolucao';
import { ProximaSolucao } from '../_components/ProximaSolucao';
import styles from './pagina.module.css';

/* `obterSolucao` é `cache()`-ada: esta chamada e a da página são UMA ida ao banco. */
export async function generateMetadata({
  params,
}: PageProps<'/solucoes/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const solucao = await obterSolucao(slug);
  return { title: solucao?.titulo ?? 'Projeto' };
}

/**
 * Detalhe da solução — a ficha de implantação.
 *
 * ESTE ARQUIVO É SÓ DADO E MOLDURA. Toda a composição vive na `FichaSolucao`,
 * que é cliente porque três partes da tela derivam do progresso local. O que fica
 * aqui é o que só o servidor sabe fazer de graça: as duas leituras, os ícones
 * `lucide` já RENDERIZADOS (elemento, não referência — com a referência, o
 * consumidor cliente importaria a biblioteca para poder chamá-la) e a moldura do
 * vídeo.
 *
 * NÃO HÁ BOTÃO "VOLTAR" AQUI. A trilha do cabeçalho já traz `‹ Projetos` em
 * toda tela de detalhe; um segundo controle de retorno a 40px de distância é o
 * tipo de duplicata que aparece quando duas telas evoluem separadas.
 */
export default async function SolucaoPage({ params }: PageProps<'/solucoes/[slug]'>) {
  const { slug } = await params;
  const solucao = await obterSolucao(slug);
  if (!solucao) notFound();

  /* Depois do `notFound()` porque a vizinha só faz sentido se esta existe. */
  const proxima = await obterProximaSolucao(slug);

  const etapas = solucao.itens.filter((i) => i.tipo === 'etapa');
  const ferramentas = solucao.itens.filter((i) => i.tipo === 'ferramenta');
  const prompts = solucao.itens.filter((i) => i.tipo === 'prompt');

  return (
    <div className={`${styles.pagina} ${entrada.bloco}`}>
      {/* Alimenta a trilha do cabeçalho. Renderiza null; some ao sair da tela, e
          é o desmonte que devolve o cabeçalho ao nome da seção. */}
      <DefinirTrilha
        voltarPara="/solucoes"
        voltarRotulo="Projetos"
        meio={solucao.categoria}
        atual={solucao.titulo}
      />

      <FichaSolucao
        slug={solucao.slug}
        titulo={solucao.titulo}
        resumo={solucao.resumo}
        categoria={solucao.categoria}
        etapas={etapas}
        ferramentas={ferramentas}
        prompts={prompts}
        icone={
          (solucao.categoria && ICONES_CATEGORIAS[solucao.categoria]) || ICONE_CATEGORIA_PADRAO
        }
        video={<VideoConteudo videoUrl={solucao.video_url} titulo={solucao.titulo} />}
        proxima={proxima ? <ProximaSolucao proxima={proxima} /> : null}
      />
    </div>
  );
}

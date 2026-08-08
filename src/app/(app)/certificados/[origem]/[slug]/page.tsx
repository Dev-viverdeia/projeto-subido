import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterFormacao, obterSolucao } from '@/lib/conteudo/queries';
import { idsPassosProjeto } from '@/lib/projetos/roteiro';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../../../_components/CabecalhoPagina';
import { CertificadoVista } from '../../_components/CertificadoVista';

/**
 * O CERTIFICADO — o documento em si, um por conteúdo concluído.
 *
 * A EMISSÃO É O NAVEGADOR: a folha é HTML em proporção A4 paisagem com CSS de
 * impressão — "salvar como PDF" no diálogo de imprimir produz o arquivo, sem
 * backend. O que um backend acrescentaria (código de verificação público,
 * registro auditável) continua sendo outra fase; o que NÃO dá para fingir é
 * dito na folha: a conclusão vem do progresso desta conta.
 *
 * QUEM DECIDE SE HÁ CERTIFICADO É O CLIENTE: o layout já hidratou o progresso
 * da conta, e a `CertificadoVista` só desenha a folha se a conclusão for real.
 * URL adivinhada de conteúdo não concluído mostra o estado honesto.
 *
 * O nome vem do JWT (user_metadata.nome, como em /conta) — sem ida ao banco.
 */

const ORIGENS = ['formacao', 'solucao'] as const;
type Origem = (typeof ORIGENS)[number];

function ehOrigem(valor: string): valor is Origem {
  return (ORIGENS as readonly string[]).includes(valor);
}

async function carregar(origem: Origem, slug: string) {
  if (origem === 'formacao') {
    const formacao = await obterFormacao(slug);
    if (!formacao) return null;
    return {
      titulo: formacao.titulo,
      itemIds: formacao.modulos.flatMap((m) => m.aulas.map((a) => a.id)),
      href: `/formacoes/${slug}`,
    };
  }
  const solucao = await obterSolucao(slug);
  if (!solucao) return null;
  return {
    titulo: solucao.titulo,
    itemIds: solucao.projeto
      ? idsPassosProjeto(solucao.slug, solucao.projeto.roteiro)
      : solucao.itens.filter((i) => i.tipo === 'etapa').map((i) => i.id),
    href: `/solucoes/${slug}`,
  };
}

export async function generateMetadata({
  params,
}: PageProps<'/certificados/[origem]/[slug]'>): Promise<Metadata> {
  const { origem, slug } = await params;
  if (!ehOrigem(origem)) return { title: 'Certificado' };
  const conteudo = await carregar(origem, slug);
  return { title: conteudo ? `Certificado · ${conteudo.titulo}` : 'Certificado' };
}

export default async function CertificadoPage({
  params,
}: PageProps<'/certificados/[origem]/[slug]'>) {
  const { origem, slug } = await params;
  if (!ehOrigem(origem)) notFound();

  const [conteudo, supabase] = [await carregar(origem, slug), await createClient()];
  if (!conteudo || conteudo.itemIds.length === 0) notFound();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const metadata = claims?.user_metadata;
  const nome =
    typeof metadata?.nome === 'string' && metadata.nome.trim().length > 0
      ? metadata.nome
      : typeof claims?.email === 'string'
        ? claims.email
        : '—';

  return (
    <>
      <CabecalhoPagina titulo="Certificado" oculto />
      <CertificadoVista
        origem={origem}
        titulo={conteudo.titulo}
        itemIds={conteudo.itemIds}
        hrefConteudo={conteudo.href}
        nome={nome}
      />
    </>
  );
}

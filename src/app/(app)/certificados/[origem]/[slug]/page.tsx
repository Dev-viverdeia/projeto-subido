import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { carregarCertificavel, type OrigemCertificado } from '@/lib/certificados/conteudo';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../../../_components/CabecalhoPagina';
import { CertificadoVista } from '../../_components/CertificadoVista';

/**
 * O CERTIFICADO — o documento em si, um por conteúdo concluído.
 *
 * A folha é HTML em proporção A4 paisagem; "salvar como PDF" usa o diálogo de
 * impressão do navegador. O registro público e seu código verificável são
 * criados no backend somente depois da validação da conclusão.
 *
 * A vista usa o progresso hidratado para mostrar o estado real, mas a emissão
 * pública é validada novamente no servidor antes de gravar o registro. Uma URL
 * adivinhada de conteúdo não concluído mostra o estado honesto.
 *
 * O nome vem do JWT (user_metadata.nome, como em /conta) — sem ida ao banco.
 */

const ORIGENS = ['formacao', 'solucao'] as const;
type Origem = OrigemCertificado;

function ehOrigem(valor: string): valor is Origem {
  return (ORIGENS as readonly string[]).includes(valor);
}

export async function generateMetadata({
  params,
}: PageProps<'/certificados/[origem]/[slug]'>): Promise<Metadata> {
  const { origem, slug } = await params;
  if (!ehOrigem(origem)) return { title: 'Certificado' };
  const conteudo = await carregarCertificavel(origem, slug);
  return { title: conteudo ? `Certificado · ${conteudo.titulo}` : 'Certificado' };
}

export default async function CertificadoPage({
  params,
}: PageProps<'/certificados/[origem]/[slug]'>) {
  const { origem, slug } = await params;
  if (!ehOrigem(origem)) notFound();

  const [conteudo, supabase] = [await carregarCertificavel(origem, slug), await createClient()];
  if (!conteudo || conteudo.aprendizadoIds.length + conteudo.implementacaoIds.length === 0)
    notFound();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const metadata = claims?.user_metadata;
  const nome =
    typeof metadata?.nome === 'string' && metadata.nome.trim().length > 0
      ? metadata.nome
      : typeof claims?.email === 'string'
        ? claims.email
        : '—';
  const { data: emissao } = await supabase
    .from('certificados_emitidos')
    .select('codigo')
    .eq('origem', origem)
    .eq('slug', slug)
    .maybeSingle();

  return (
    <>
      <CabecalhoPagina titulo="Certificado" oculto />
      <CertificadoVista
        origem={origem}
        slug={slug}
        titulo={conteudo.titulo}
        aprendizadoIds={conteudo.aprendizadoIds}
        implementacaoIds={conteudo.implementacaoIds}
        hrefConteudo={conteudo.href}
        nome={nome}
        codigoInicial={emissao?.codigo ?? null}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://projeto-subido.vercel.app'}
      />
    </>
  );
}

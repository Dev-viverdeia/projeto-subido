import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import { DocumentoCertificado } from '@/components/certificados/DocumentoCertificado';
import { buscarCertificadoPublico } from '@/lib/certificados/publico';
import { TAMANHO_IMAGEM_CERTIFICADO } from '@/lib/certificados/compartilhamento';
import { apresentacaoCertificado } from '@/lib/certificados/apresentacao';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: PageProps<'/certificado/[codigo]'>): Promise<Metadata> {
  const { codigo } = await params;
  const certificado = await buscarCertificadoPublico(codigo);
  const apresentacao = apresentacaoCertificado(certificado?.nome ?? '');
  const titulo = certificado
    ? `${apresentacao.nome}${apresentacao.demonstracao ? ' · Demonstração' : ''} · ${certificado.titulo}`
    : 'Certificado não encontrado';
  const descricao = apresentacao.demonstracao
    ? 'Prévia ilustrativa de certificado Subido + Viver de IA. Não comprova conclusão.'
    : certificado
      ? `${certificado.nome} concluiu ${certificado.titulo}. Certificado Subido + Viver de IA, com registro público de verificação.`
      : 'Certificado emitido pela plataforma Subido.';
  return {
    title: titulo,
    description: descricao,
    alternates: certificado ? { canonical: `/certificado/${codigo}` } : undefined,
    openGraph: certificado
      ? {
          type: 'article',
          url: `/certificado/${codigo}`,
          siteName: 'Subido',
          title: titulo,
          description: descricao,
          images: [
            {
              url: `/certificado/${codigo}/imagem`,
              ...TAMANHO_IMAGEM_CERTIFICADO,
              type: 'image/png',
              alt: `Certificado de ${certificado.nome} em ${certificado.titulo}`,
            },
          ],
        }
      : undefined,
    twitter: certificado
      ? {
          card: 'summary_large_image',
          title: titulo,
          description: descricao,
          images: [`/certificado/${codigo}/imagem`],
        }
      : undefined,
    robots: certificado ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function CertificadoPublicoPage({
  params,
}: PageProps<'/certificado/[codigo]'>) {
  const { codigo } = await params;
  const certificado = await buscarCertificadoPublico(codigo);
  if (!certificado) notFound();
  const { demonstracao } = apresentacaoCertificado(certificado.nome);

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <p>{demonstracao ? 'Certificado de demonstração' : 'Certificado de conclusão'}</p>
        <span>
          <BadgeCheck size={16} strokeWidth={1.8} aria-hidden="true" />
          {demonstracao ? 'Registro demonstrativo' : 'Registro verificado'}
        </span>
      </header>

      <div className={styles.suporte}>
        <DocumentoCertificado
          nome={certificado.nome}
          titulo={certificado.titulo}
          origem={certificado.origem === 'formacao' ? 'formacao' : 'solucao'}
          concluidoEm={certificado.concluido_em}
          codigo={certificado.codigo}
        />
      </div>

      <p className={styles.nota}>
        {demonstracao
          ? 'Exemplo de apresentação de um certificado. Não comprova conclusão.'
          : 'Autenticidade confirmada pelo registro de conclusão na plataforma Subido.'}
      </p>
    </main>
  );
}

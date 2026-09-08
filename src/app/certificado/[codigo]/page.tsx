import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { BadgeCheck } from 'lucide-react';
import { DocumentoCertificado } from '@/components/certificados/DocumentoCertificado';
import { createClient } from '@/lib/supabase/server';
import styles from './page.module.css';

const buscarCertificado = cache(async (codigo: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('certificado_publico', { p_codigo: codigo })
    .maybeSingle();
  if (error || !data) return null;
  return data;
});

export async function generateMetadata({
  params,
}: PageProps<'/certificado/[codigo]'>): Promise<Metadata> {
  const { codigo } = await params;
  const certificado = await buscarCertificado(codigo);
  const titulo = certificado ? `Certificado · ${certificado.titulo}` : 'Certificado';
  const descricao = certificado
    ? `${certificado.nome} concluiu ${certificado.titulo} na plataforma Subido. Confira o registro público.`
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
        }
      : undefined,
    robots: certificado ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function CertificadoPublicoPage({
  params,
}: PageProps<'/certificado/[codigo]'>) {
  const { codigo } = await params;
  const certificado = await buscarCertificado(codigo);
  if (!certificado) notFound();

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <p>Certificado de conclusão</p>
        <span>
          <BadgeCheck size={16} strokeWidth={1.8} aria-hidden="true" />
          Registro verificado
        </span>
      </header>

      <DocumentoCertificado
        nome={certificado.nome}
        titulo={certificado.titulo}
        origem={certificado.origem === 'formacao' ? 'formacao' : 'solucao'}
        concluidoEm={certificado.concluido_em}
        codigo={certificado.codigo}
      />

      <p className={styles.nota}>
        Autenticidade confirmada pelo registro de conclusão na plataforma Subido.
      </p>
    </main>
  );
}

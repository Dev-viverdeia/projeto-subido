import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { BadgeCheck } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
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
  return {
    title: certificado ? `Certificado · ${certificado.titulo}` : 'Certificado',
    description: certificado
      ? `${certificado.nome} concluiu ${certificado.titulo} na plataforma Subido.`
      : 'Certificado emitido pela plataforma Subido.',
  };
}

export default async function CertificadoPublicoPage({
  params,
}: PageProps<'/certificado/[codigo]'>) {
  const { codigo } = await params;
  const certificado = await buscarCertificado(codigo);
  if (!certificado) notFound();

  const concluido = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
    new Date(certificado.concluido_em),
  );

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <SubidoLogo size={20} />
        <span>
          <BadgeCheck size={16} strokeWidth={1.8} aria-hidden="true" />
          Registro verificado
        </span>
      </header>

      <article className={styles.certificado}>
        <div className={styles.marca} aria-hidden="true" />
        <p className={styles.eyebrow}>Certificado de conclusão</p>
        <p className={styles.intro}>A plataforma Subido certifica que</p>
        <h1>{certificado.nome}</h1>
        <p className={styles.concluiu}>
          concluiu {certificado.origem === 'formacao' ? 'a formação' : 'o projeto'}
        </p>
        <h2>{certificado.titulo}</h2>

        <dl>
          <div>
            <dt>Conclusão</dt>
            <dd>{concluido}</dd>
          </div>
          <div>
            <dt>Código</dt>
            <dd>{certificado.codigo}</dd>
          </div>
        </dl>
      </article>

      <p className={styles.nota}>
        Este registro foi emitido depois que todas as etapas foram concluídas na conta do aluno.
      </p>
    </main>
  );
}

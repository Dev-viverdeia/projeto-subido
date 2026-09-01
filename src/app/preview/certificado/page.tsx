import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CertificadoVista } from '@/app/(app)/certificados/_components/CertificadoVista';
import type { EstadoProgressoConta } from '@/lib/progresso/local';
import styles from '../aprendizado.module.css';

export const metadata: Metadata = { title: 'Preview · Certificado' };

const PROGRESSO: EstadoProgressoConta = {
  aulas: {
    'aula-chatgpt-1': '2026-08-28T12:00:00.000Z',
    'aula-chatgpt-2': '2026-08-29T12:00:00.000Z',
  },
  formacoes: { 'chatgpt-para-o-trabalho': '2026-08-29T12:00:00.000Z' },
  etapas: {},
  solucoes: {},
};

export default function PreviewCertificadoPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <CertificadoVista
          origem="formacao"
          slug="chatgpt-para-o-trabalho"
          titulo="ChatGPT para o trabalho"
          aprendizadoIds={['aula-chatgpt-1', 'aula-chatgpt-2']}
          implementacaoIds={[]}
          hrefConteudo="/formacoes/chatgpt-para-o-trabalho"
          nome="Rafael Milagre"
          codigoInicial="subido-preview-2026"
          siteUrl="https://subido.viverdeia.ai"
          progressoPreview={PROGRESSO}
        />
      </div>
    </main>
  );
}

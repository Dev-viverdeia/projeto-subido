import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjetoGuiado } from '@/app/(app)/solucoes/_components/ProjetoGuiado';
import {
  ferramentasPreview,
  projetoPreview,
  promptsPreview,
  projetosPreview,
  rotaPreview,
} from '../projetos/fixture';
import styles from '../projetos/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Projeto guiado' };

export default function PreviewProjetoPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <ProjetoGuiado
          slug="sdr-atendimento"
          titulo="SDR de Atendimento com IA"
          resumo={projetoPreview.resultado}
          categoria="Automação com IA"
          projeto={projetoPreview}
          ferramentas={ferramentasPreview}
          prompts={promptsPreview}
          videoUrl={null}
          proxima={{
            slug: projetosPreview[1]!.slug,
            titulo: projetosPreview[1]!.titulo,
            categoria: projetosPreview[1]!.categoria,
            mesmaTrilha: true,
          }}
          rotaComercial={rotaPreview}
        />
      </div>
    </main>
  );
}

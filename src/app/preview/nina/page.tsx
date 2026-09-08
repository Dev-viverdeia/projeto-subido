import { notFound } from 'next/navigation';
import { ProjetoGuiado } from '@/app/(app)/solucoes/_components/ProjetoGuiado';
import { lerRoteiroProjeto } from '@/lib/projetos/roteiro';
import { ferramentasPreview, promptsPreview, rotaPreview } from '../projetos/fixture';
import styles from '../projetos/preview.module.css';
import fixture from './fixture.json';

/** Snapshot do conteúdo educacional público da Nina em 08/09/2026. Sem dados de usuários. */
export default function PreviewNinaPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const roteiro = lerRoteiroProjeto(fixture.roteiro);
  if (!roteiro) notFound();
  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <ProjetoGuiado
          slug="sdr-atendimento-qualificacao"
          titulo="Atendimento no WhatsApp com IA"
          resumo="Atenda, qualifique e agende conversas com a Nina, com passagem para a equipe."
          categoria="Atendimento e vendas"
          projeto={{ ...fixture, roteiro }}
          ferramentas={ferramentasPreview}
          prompts={promptsPreview}
          videoUrl={null}
          proxima={null}
          rotaComercial={rotaPreview}
        />
      </div>
    </main>
  );
}

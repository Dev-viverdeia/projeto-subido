import { notFound } from 'next/navigation';
import { ProjetoGuiado } from '@/app/(app)/solucoes/_components/ProjetoGuiado';
import { lerRoteiroProjeto } from '@/lib/projetos/roteiro';
import { ferramentasPreview, promptsPreview, rotaPreview } from '../projetos/fixture';
import styles from '../projetos/preview.module.css';
import fixture from './fixture.json';

/** Conteúdo educacional público em 08/09/2026. Sem contas, gravações ou dados de usuários. */
export default function PreviewReunioesProjetoPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const roteiro = lerRoteiroProjeto(fixture.roteiro);
  if (!roteiro) notFound();
  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <ProjetoGuiado
          slug="inteligencia-comercial-com-ia"
          titulo="Assistente de reuniões com IA"
          resumo="Organize falas, decisões e próximas ações, com revisão antes de atualizar o CRM."
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

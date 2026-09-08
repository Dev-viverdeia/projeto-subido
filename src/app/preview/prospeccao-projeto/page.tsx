import { notFound } from 'next/navigation';
import { ProjetoGuiado } from '@/app/(app)/solucoes/_components/ProjetoGuiado';
import { lerRoteiroProjeto } from '@/lib/projetos/roteiro';
import { ferramentasPreview, promptsPreview, rotaPreview } from '../projetos/fixture';
import styles from '../projetos/preview.module.css';
import fixture from './fixture.json';

/** Snapshot do conteúdo educacional público de Prospecção em 08/09/2026. Sem dados de usuários. */
export default function PreviewProspeccaoProjetoPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const roteiro = lerRoteiroProjeto(fixture.roteiro);
  if (!roteiro) notFound();
  return (
    <main className={styles.pagina}>
      <div className={styles.conteudo}>
        <ProjetoGuiado
          slug="maquina-prospeccao-b2b"
          titulo="Prospecção de clientes com IA"
          resumo="Encontre empresas com perfil e prepare uma lista revisada para vendas."
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

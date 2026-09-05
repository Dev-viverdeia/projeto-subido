import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AulaConteudo } from '@/app/(app)/formacoes/_components/AulaConteudo';
import { FORMACAO_DEMO } from '../formacoes/fixture';
import preview from '../aprendizado.module.css';

export const metadata: Metadata = { title: 'Preview · Aula' };

export default function PreviewAulaPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const aula = FORMACAO_DEMO.modulos[0]?.aulas[0];
  const proxima = FORMACAO_DEMO.modulos[0]?.aulas[1];
  if (!aula) notFound();

  return (
    <main className={preview.pagina}>
      <AulaConteudo
        formacao={FORMACAO_DEMO}
        aula={aula}
        videoUrl={null}
        anterior={null}
        proxima={proxima ?? null}
        posicao={1}
        total={5}
      />
    </main>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AulaConteudo } from '@/app/(app)/formacoes/_components/AulaConteudo';
import { FORMACAO_DEMO } from '../formacoes/fixture';
import preview from '../aprendizado.module.css';

export const metadata: Metadata = { title: 'Preview · Aula' };

export default async function PreviewAulaPage({
  searchParams,
}: {
  searchParams: Promise<{ ultima?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { ultima } = await searchParams;
  const aulas = FORMACAO_DEMO.modulos.flatMap((modulo) => modulo.aulas);
  const indice = ultima === '1' ? aulas.length - 1 : 0;
  const aula = aulas[indice];
  if (!aula) notFound();

  return (
    <main className={preview.pagina}>
      <AulaConteudo
        formacao={FORMACAO_DEMO}
        aula={aula}
        videoUrl={null}
        anterior={aulas[indice - 1] ?? null}
        proxima={aulas[indice + 1] ?? null}
        posicao={indice + 1}
        total={aulas.length}
      />
    </main>
  );
}

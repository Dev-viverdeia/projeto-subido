import { notFound } from 'next/navigation';
import { PassosGuia } from '@/components/suporte/PassosGuia';
import { LinkAcao } from '@/components/suporte/LinkAcao';
import { GUIAS_INICIAIS } from '@/lib/suporte/guias-iniciais';
import s from '@/components/suporte/suporte.module.css';

export default async function PreviewGuia({ searchParams }: PageProps<'/preview/guia-ajuda'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { slug } = await searchParams;
  const guia = GUIAS_INICIAIS.find((g) => g.slug === slug);
  if (!guia) notFound();
  return (
    <main className={s.publico}>
      <article className={s.artigo}>
        <header>
          <h1 className={s.titulo}>{guia.titulo}</h1>
          <p className={s.subtitulo}>{guia.resumo}</p>
        </header>
        <PassosGuia slug={guia.slug} passos={guia.passos} />
        <aside className={s.dica}>{guia.dica}</aside>
        <LinkAcao href={guia.destino}>Abrir na plataforma</LinkAcao>
      </article>
    </main>
  );
}

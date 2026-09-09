import { LinkAcao } from '@/components/suporte/LinkAcao';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import pedirAjuda from '../../../../public/ajuda/pedir-ajuda.png';
import acompanharResposta from '../../../../public/ajuda/acompanhar-resposta.png';
import { ArrowLeft, Info } from 'lucide-react';
import { artigosSuporte, usuarioSuporte } from '@/lib/suporte/servidor';
import { CATEGORIAS } from '@/lib/suporte/contrato';
import { FeedbackGuia } from '@/components/suporte/FeedbackGuia';
import s from '@/components/suporte/suporte.module.css';
export async function generateMetadata({ params }: PageProps<'/ajuda/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const a = (await artigosSuporte()).find((a) => a.slug === slug);
  return { title: a?.titulo ?? 'Guia', alternates: { canonical: `/ajuda/${slug}` } };
}
export default async function GuiaPage({ params }: PageProps<'/ajuda/[slug]'>) {
  const { slug } = await params;
  const [artigos, user] = await Promise.all([artigosSuporte(), usuarioSuporte()]);
  const a = artigos.find((a) => a.slug === slug);
  if (!a) notFound();
  return (
    <div className={s.pagina}>
      <Link href={user ? '/suporte' : '/ajuda'} className={s.atalho}>
        <ArrowLeft size={18} />
        Central de ajuda
      </Link>
      <article className={s.artigo}>
        <header>
          <p className={s.meta}>{CATEGORIAS[a.categoria]}</p>
          <h1 className={s.titulo}>{a.titulo}</h1>
          <p className={s.subtitulo}>{a.resumo}</p>
        </header>
        <ol className={s.passos}>
          {a.passos.map((passo, i) => (
            <li key={i} className={s.passo}>
              <span aria-hidden="true">{i + 1}</span>
              <div className={s.conteudoPasso}>
                <p>{passo}</p>
                {a.slug === 'pedir-e-acompanhar-ajuda' && i < 2 && (
                  <figure className={s.capturaGuia}>
                    <Image
                      src={i === 0 ? pedirAjuda : acompanharResposta}
                      alt={
                        i === 0
                          ? 'Formulário com assunto, descrição e opção de anexar um arquivo.'
                          : 'Conversa com a pergunta do cliente e a resposta da equipe.'
                      }
                      sizes="(max-width: 767px) 85vw, 650px"
                    />
                    <figcaption>Exemplo na plataforma, com dados demonstrativos.</figcaption>
                  </figure>
                )}
              </div>
            </li>
          ))}
        </ol>
        {a.dica && (
          <aside className={s.dica}>
            <Info size={20} />
            <p>{a.dica}</p>
          </aside>
        )}
        <div className={s.acoes}>
          <LinkAcao href={a.destino}>Abrir na plataforma</LinkAcao>
          <Link href={user ? '/suporte/novo' : '/ajuda/acesso'} className={s.atalho}>
            Pedir ajuda à equipe
          </Link>
        </div>
        <FeedbackGuia slug={a.slug} />
        <p className={s.meta}>
          Revisado em{' '}
          {new Date(a.atualizado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
        </p>
        <section>
          <h2 className={s.secaoTitulo}>Neste assunto</h2>
          <div className={s.lista}>
            {artigos
              .filter((g) => g.categoria === a.categoria && g.slug !== a.slug)
              .slice(0, 3)
              .map((g) => (
                <Link key={g.slug} href={`/ajuda/${g.slug}`} className={s.atalho}>
                  {g.titulo}
                </Link>
              ))}
          </div>
        </section>
      </article>
    </div>
  );
}

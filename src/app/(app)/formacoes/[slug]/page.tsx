import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterFormacao } from '@/lib/conteudo/queries';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import entrada from '../../_components/entrada.module.css';
import { CursoConteudo } from '../_components/CursoConteudo';
import styles from './pagina.module.css';

export async function generateMetadata({
  params,
}: PageProps<'/formacoes/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const formacao = await obterFormacao(slug);
  return { title: formacao?.titulo ?? 'Formação' };
}

/** Detalhe do curso. Server: busca + 404; o resto é client (progresso local). */
export default async function FormacaoPage({ params }: PageProps<'/formacoes/[slug]'>) {
  const { slug } = await params;
  const formacao = await obterFormacao(slug);
  if (!formacao) notFound();

  return (
    <div className={styles.pagina}>
      <div className={entrada.bloco}>
        <BotaoVoltar fallback="/formacoes" rotulo="Formações" />
      </div>
      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <CursoConteudo formacao={formacao} />
      </div>
    </div>
  );
}

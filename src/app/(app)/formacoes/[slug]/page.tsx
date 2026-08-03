import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterFormacao } from '@/lib/conteudo/queries';
import entrada from '../../_components/entrada.module.css';
import { CursoConteudo } from '../_components/CursoConteudo';
import { DefinirTrilha } from '../../_components/trilha/contexto';
import styles from './pagina.module.css';

export async function generateMetadata({
  params,
}: PageProps<'/formacoes/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const formacao = await obterFormacao(slug);
  return { title: formacao?.titulo ?? 'Formação' };
}

/**
 * Detalhe do curso. Server: busca + 404; o resto é client (progresso local).
 *
 * SEM BOTÃO "VOLTAR": a trilha do cabeçalho já traz `‹ Formações` em toda tela de
 * detalhe. Esta era a última das três a empilhar os dois controles de retorno a
 * 40px um do outro.
 */
export default async function FormacaoPage({ params }: PageProps<'/formacoes/[slug]'>) {
  const { slug } = await params;
  const formacao = await obterFormacao(slug);
  if (!formacao) notFound();

  return (
    <div className={styles.pagina}>
      {/* Alimenta a trilha do cabeçalho. Renderiza null; some ao sair da
          tela, e é o desmonte que devolve o cabeçalho ao nome da seção. */}
      <DefinirTrilha voltarPara="/formacoes" voltarRotulo="Formações" atual={formacao.titulo} />

      <div className={entrada.bloco}>
        <CursoConteudo formacao={formacao} />
      </div>
    </div>
  );
}

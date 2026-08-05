import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterConversa } from '@/lib/consultor/queries';
import { DefinirTrilha } from '../../_components/trilha/contexto';
import entrada from '../../_components/entrada.module.css';
import { Conversa } from '../_components/Conversa';
import { Mensagens } from '../_components/Mensagens';
import styles from './pagina.module.css';

/**
 * Uma conversa do Consultor. A URL é o estado: recarregar ou trocar de aparelho
 * cai exatamente onde a conversa parou, porque tudo mora no banco.
 */
export async function generateMetadata({
  params,
}: PageProps<'/consultor/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const conversa = await obterConversa(id);
  return { title: conversa?.thread.titulo || 'Conversa' };
}

export default async function ConversaDoConsultorPage({ params }: PageProps<'/consultor/[id]'>) {
  const { id } = await params;
  const conversa = await obterConversa(id);

  if (!conversa) notFound();

  return (
    <div className={`${styles.pagina} ${entrada.bloco}`}>
      <DefinirTrilha
        voltarPara="/consultor"
        voltarRotulo="Consultor"
        atual={conversa.thread.titulo}
      />

      <Mensagens mensagens={conversa.mensagens} />

      <div className={styles.rodape}>
        <Conversa threadId={conversa.thread.id} />
      </div>
    </div>
  );
}

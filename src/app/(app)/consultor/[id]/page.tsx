import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageSquarePlus } from 'lucide-react';
import { apagarConversa } from '@/lib/consultor/actions';
import { listarThreads, obterConversa } from '@/lib/consultor/queries';
import { BotaoExcluir } from '../../admin/_components/BotaoExcluir';
import { DefinirTrilha } from '../../_components/trilha/contexto';
import { HistoricoDropdown } from '../../_components/HistoricoDropdown';
import entrada from '../../_components/entrada.module.css';
import { Conversa } from '../_components/Conversa';
import { ListaConversas } from '../_components/ListaConversas';
import { Mensagens } from '../_components/Mensagens';
import styles from './pagina.module.css';

/**
 * Uma conversa do Consultor. A URL é o estado: recarregar ou trocar de aparelho
 * cai exatamente onde a conversa parou, porque tudo mora no banco.
 *
 * O TOPO tem os três controles da conversa: as outras conversas (dropdown, o
 * mesmo do Builder), uma nova, e a exclusão — que é definitiva e por isso usa a
 * confirmação em dois toques do BotaoExcluir.
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
  const [conversa, threads] = await Promise.all([obterConversa(id), listarThreads()]);

  if (!conversa) notFound();

  return (
    <div className={`${styles.pagina} ${entrada.bloco}`}>
      <DefinirTrilha
        voltarPara="/consultor"
        voltarRotulo="Consultor"
        atual={conversa.thread.titulo}
      />

      <div className={styles.topo}>
        <Link href="/consultor" className={styles.nova}>
          <MessageSquarePlus size={15} strokeWidth={1.8} aria-hidden="true" />
          Nova conversa
        </Link>

        <div className={styles.acoes}>
          <HistoricoDropdown total={threads.length} rotulo="Suas conversas">
            <ListaConversas threads={threads} atualId={conversa.thread.id} />
          </HistoricoDropdown>

          <BotaoExcluir
            id={conversa.thread.id}
            acao={apagarConversa}
            descricao="Apagar esta conversa é definitivo: não há lixeira, e as mensagens vão junto."
          />
        </div>
      </div>

      <Mensagens mensagens={conversa.mensagens} />

      <div className={styles.rodape}>
        <Conversa threadId={conversa.thread.id} />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MessageSquarePlus } from 'lucide-react';
import { apagarConversa } from '@/lib/consultor/actions';
import { listarThreads, obterConversa } from '@/lib/consultor/queries';
import { BotaoExcluir } from '../../admin/_components/BotaoExcluir';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import { DefinirTrilha } from '../../_components/trilha/contexto';
import { HistoricoDropdown } from '../../_components/HistoricoDropdown';
import { dataCurta } from '../../builder/_components/statusBuilder';
import entrada from '../../_components/entrada.module.css';
import { Conversa } from '../_components/Conversa';
import { ListaConversas } from '../_components/ListaConversas';
import { Mensagens } from '../_components/Mensagens';
import styles from './pagina.module.css';

/**
 * Uma conversa do Consultor. A URL é o estado: recarregar ou trocar de
 * aparelho cai exatamente onde a conversa parou, porque tudo mora no banco.
 *
 * O HEADER é da conversa, não da tela: eyebrow do domínio, o título que
 * nasceu da primeira pergunta e a data de início — com os controles na mesma
 * linha (nova conversa, as outras, excluir). Abaixo dele, só a conversa.
 *
 * `pendente`: se a última mensagem gravada é do usuário, a conversa acabou de
 * nascer no browser e o consultor responde AQUI — o chat é onde a espera
 * pertence, não a tela inicial.
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

  const ultima = conversa.mensagens[conversa.mensagens.length - 1];
  const pendente = ultima?.papel === 'usuario';

  return (
    <div className={`${styles.pagina} ${entrada.bloco}`}>
      <DefinirTrilha
        voltarPara="/consultor"
        voltarRotulo="Consultor"
        atual={conversa.thread.titulo}
      />

      <header className={styles.cabecalho}>
        <div className={styles.identidade}>
          <BotaoVoltar fallback="/consultor" rotulo="Consultor" />
          <p className={styles.eyebrow}>Consultor · conversa</p>
          <h1 className={styles.tituloConversa}>{conversa.thread.titulo}</h1>
          <p className={styles.meta}>Iniciada em {dataCurta(conversa.thread.criadoEm)}</p>
        </div>

        <div className={styles.acoes}>
          <Link href="/consultor" className={styles.nova}>
            <MessageSquarePlus size={15} strokeWidth={1.8} aria-hidden="true" />
            Nova conversa
          </Link>

          <HistoricoDropdown total={threads.length} rotulo="Suas conversas">
            <ListaConversas threads={threads} atualId={conversa.thread.id} />
          </HistoricoDropdown>

          <BotaoExcluir
            id={conversa.thread.id}
            acao={apagarConversa}
            descricao="Apagar esta conversa é definitivo: não há lixeira, e as mensagens vão junto."
          />
        </div>
      </header>

      <Mensagens mensagens={conversa.mensagens} />

      <div className={styles.rodape}>
        <Conversa threadId={conversa.thread.id} pendente={pendente} />
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Bot, Database, Plus } from 'lucide-react';
import { CabecalhoPagina } from '@/app/(app)/_components/CabecalhoPagina';
import { HistoricoDropdown } from '@/app/(app)/_components/HistoricoDropdown';
import type { MensagemDoConsultor, ThreadDoConsultor } from '@/lib/consultor/queries';
import type { ExemploDoConsultor } from './Conversa';
import { Conversa } from './Conversa';
import { ListaConversas } from './ListaConversas';
import { Mensagens } from './Mensagens';
import styles from './TelaSobral.module.css';
import type { ContextoSobralTarefa } from '@/lib/projetos-execucao/contexto-sobral';

const EXEMPLOS: ExemploDoConsultor[] = [
  {
    rotulo: 'Priorizar uma venda',
    texto:
      'Olhe minhas vendas abertas, escolha a oportunidade que merece atenção agora e me diga qual é o próximo passo.',
  },
  {
    rotulo: 'Preparar uma reunião',
    texto:
      'Me ajude a preparar minha próxima reunião para entender o problema do cliente e vender o projeto de IA certo.',
  },
  {
    rotulo: 'Avançar uma entrega',
    texto:
      'Analise os projetos que estou executando e me diga o que fazer para destravar a próxima entrega.',
  },
];

type ConversaCarregada = {
  thread: ThreadDoConsultor;
  mensagens: MensagemDoConsultor[];
} | null;

/** Superfície única do Sobral AI. `/consultor` sempre chega com `conversa=null`;
 * uma conversa anterior só é aberta quando a pessoa a escolhe no histórico. */
export function TelaSobral({
  threads,
  conversa,
  contextoInicial,
}: {
  threads: ThreadDoConsultor[];
  conversa: ConversaCarregada;
  contextoInicial?: ContextoSobralTarefa | null;
}) {
  const mensagens = conversa?.mensagens ?? [];
  const ultima = mensagens[mensagens.length - 1];
  const vazio = mensagens.length === 0;

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Sobral AI" oculto />
      <section className={styles.superficie} aria-labelledby="titulo-sobral">
        <header className={styles.cabecalho}>
          <div className={styles.identidade}>
            <span className={styles.marca} aria-hidden="true">
              <Bot size={18} strokeWidth={1.8} />
            </span>
            <div>
              <h1 id="titulo-sobral">{conversa?.thread.titulo ?? 'Nova conversa'}</h1>
              <p>Sobral AI · consultor conectado à sua conta</p>
            </div>
          </div>

          <div className={styles.acoes}>
            <span className={styles.contextoAtivo} title="O Sobral usa os dados da sua conta">
              <Database size={14} strokeWidth={1.8} aria-hidden="true" />
              Dados conectados
            </span>
            {conversa ? (
              <Link href="/consultor" className={styles.novaConversa}>
                <Plus size={15} strokeWidth={2} aria-hidden="true" />
                Nova conversa
              </Link>
            ) : null}
            <HistoricoDropdown total={threads.length} rotulo="Conversas">
              {threads.length > 0 ? (
                <ListaConversas threads={threads} atualId={conversa?.thread.id} />
              ) : (
                <p className={styles.semHistorico}>Suas conversas aparecerão aqui.</p>
              )}
            </HistoricoDropdown>
          </div>
        </header>

        <div className={`${styles.areaChat} ${vazio ? styles.areaVazia : ''}`}>
          {vazio ? (
            <div className={styles.boasVindas}>
              {contextoInicial ? (
                <p className={styles.eyebrow}>Tarefa de {contextoInicial.empresa}</p>
              ) : (
                <span className={styles.assinatura} aria-hidden="true">
                  <Bot size={24} strokeWidth={1.65} />
                </span>
              )}
              <h2>
                {contextoInicial ? contextoInicial.tarefa : 'O que você quer resolver agora?'}
              </h2>
              <p className={styles.apoio}>
                {contextoInicial
                  ? 'O pedido já traz o briefing, o combinado com o cliente e os critérios desta tarefa. Revise e envie.'
                  : 'Analiso suas vendas, reuniões e projetos para indicar um próximo passo que faça sentido no seu trabalho.'}
              </p>
            </div>
          ) : (
            <div className={styles.historico}>
              <Mensagens mensagens={mensagens} />
            </div>
          )}

          <div className={styles.compositor}>
            <Conversa
              threadId={conversa?.thread.id}
              pendente={ultima?.papel === 'usuario'}
              ultimaMensagemId={ultima?.id}
              exemplos={vazio && !contextoInicial ? EXEMPLOS : undefined}
              textoInicial={contextoInicial?.mensagem}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

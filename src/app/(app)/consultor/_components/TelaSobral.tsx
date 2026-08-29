import Link from 'next/link';
import { Bot, FileText, Image as ImageIcon, Link2, Mic, Plus } from 'lucide-react';
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
    rotulo: 'Definir meu próximo passo',
    texto: 'Olhe o que já aconteceu na minha plataforma e me diga o que eu deveria fazer agora.',
  },
  {
    rotulo: 'Preparar uma venda',
    texto: 'Me ajude a preparar a próxima conversa comercial para vender um projeto de IA.',
  },
  {
    rotulo: 'Escolher o que estudar',
    texto: 'Qual aula ou projeto da plataforma pode me ajudar no problema que estou trabalhando?',
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
              <Bot size={19} strokeWidth={1.8} />
            </span>
            <div>
              <h1 id="titulo-sobral">Sobral AI</h1>
              <p>Seu consultor para vender e entregar projetos de IA.</p>
            </div>
          </div>

          <div className={styles.acoes}>
            {conversa ? (
              <Link href="/consultor" className={styles.novaConversa}>
                <Plus size={15} strokeWidth={2} aria-hidden="true" />
                Nova conversa
              </Link>
            ) : null}
            <HistoricoDropdown total={threads.length} rotulo="Histórico">
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
              <p className={styles.eyebrow}>
                {contextoInicial
                  ? `Tarefa conectada · ${contextoInicial.empresa}`
                  : 'Conversa nova'}
              </p>
              <h2>{contextoInicial ? contextoInicial.tarefa : 'Como posso ajudar?'}</h2>
              <p className={styles.apoio}>
                {contextoInicial
                  ? 'O pedido abaixo já reúne o briefing, o combinado com o cliente e os critérios desta tarefa. Revise e envie quando estiver pronto.'
                  : 'Pergunte sobre uma venda, um cliente ou uma implementação. Você também pode enviar um arquivo para eu analisar.'}
              </p>
              <ul className={styles.capacidades} aria-label="Formatos aceitos">
                <li>
                  <FileText size={15} aria-hidden="true" /> Documentos
                </li>
                <li>
                  <ImageIcon size={15} aria-hidden="true" /> Imagens
                </li>
                <li>
                  <Mic size={15} aria-hidden="true" /> Áudios
                </li>
              </ul>
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
            <p className={styles.contextoConectado}>
              <Link2 size={13} strokeWidth={1.8} aria-hidden="true" />O Sobral AI usa seus registros
              da plataforma para responder com contexto.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ContactRound,
  Database,
  GraduationCap,
  Plus,
  ShieldCheck,
} from 'lucide-react';
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

const FONTES_DO_CONTEXTO = [
  {
    titulo: 'Vendas',
    detalhe: 'clientes, etapas e próximos passos',
    icone: ContactRound,
  },
  {
    titulo: 'Reuniões',
    detalhe: 'agenda, registros e decisões',
    icone: CalendarDays,
  },
  {
    titulo: 'Projetos',
    detalhe: 'tarefas, prazos e entregas',
    icone: BriefcaseBusiness,
  },
  {
    titulo: 'Aprendizado',
    detalhe: 'formações e projetos guiados',
    icone: GraduationCap,
  },
] as const;

type ConversaCarregada = {
  thread: ThreadDoConsultor;
  mensagens: MensagemDoConsultor[];
} | null;

function tituloLegivel(titulo: string): string {
  const limpo = titulo.trim();
  return limpo ? `${limpo.charAt(0).toLocaleUpperCase('pt-BR')}${limpo.slice(1)}` : 'Conversa';
}

function saudacao(): string {
  const hora = Number(
    new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      hourCycle: 'h23',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date()),
  );
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Superfície única do Sobral AI. `/consultor` sempre chega com `conversa=null`;
 * uma conversa anterior só é aberta quando a pessoa a escolhe no histórico. */
export function TelaSobral({
  threads,
  conversa,
  contextoInicial,
  nome,
}: {
  threads: ThreadDoConsultor[];
  conversa: ConversaCarregada;
  contextoInicial?: ContextoSobralTarefa | null;
  nome?: string | null;
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
              <h1 id="titulo-sobral">
                {conversa ? tituloLegivel(conversa.thread.titulo) : 'Nova conversa'}
              </h1>
              <p>Sobral AI · consultor do seu trabalho</p>
            </div>
          </div>

          <div className={styles.acoes}>
            <details className={styles.contexto}>
              <summary aria-label="Ver o que o Sobral AI usa da sua conta">
                <Database size={14} strokeWidth={1.8} aria-hidden="true" />
                <span>Contexto da conta</span>
                <ChevronDown
                  className={styles.contextoSeta}
                  size={14}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </summary>
              <div className={styles.contextoPainel}>
                <div className={styles.contextoCabecalho}>
                  <span className={styles.contextoIcone} aria-hidden="true">
                    <Database size={18} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>O que o Sobral consegue usar</strong>
                    <p>Dados da sua conta e arquivos enviados nesta conversa.</p>
                  </div>
                </div>
                <ul className={styles.contextoFontes}>
                  {FONTES_DO_CONTEXTO.map((fonte) => {
                    const Icone = fonte.icone;
                    return (
                      <li key={fonte.titulo}>
                        <Icone size={16} strokeWidth={1.8} aria-hidden="true" />
                        <span>
                          <strong>{fonte.titulo}</strong>
                          <small>{fonte.detalhe}</small>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className={styles.contextoPrivacidade}>
                  <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                  Dados de contato não são enviados por padrão.
                </p>
              </div>
            </details>
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
                {contextoInicial ? (
                  contextoInicial.tarefa
                ) : (
                  <>
                    {nome ? `${saudacao()}, ${nome}.` : 'Vamos ao que importa.'}
                    <span>O que precisa avançar?</span>
                  </>
                )}
              </h2>
              <p className={styles.apoio}>
                {contextoInicial
                  ? 'O pedido já traz o briefing, o combinado com o cliente e os critérios desta tarefa. Revise e envie.'
                  : 'Cruzo o que já está na plataforma para recomendar uma ação concreta.'}
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

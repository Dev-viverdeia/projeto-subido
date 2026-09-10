import Link from 'next/link';
import { ChevronDown, Database, Plus, ShieldCheck } from 'lucide-react';
import { IconeProduto } from '@/components/brand/IconeProduto';
import { CabecalhoPagina } from '@/app/(app)/_components/CabecalhoPagina';
import { HistoricoDropdown } from '@/app/(app)/_components/HistoricoDropdown';
import type { MensagemDoConsultor, ThreadDoConsultor } from '@/lib/consultor/queries';
import type { ExemploDoConsultor } from './Conversa';
import { Conversa } from './Conversa';
import { ListaConversas } from './ListaConversas';
import { BibliotecaConversas } from './BibliotecaConversas';
import { ArquivosConversa } from './ArquivosConversa';
import { BuscaMensagens } from './BuscaMensagens';
import historicoStyles from './ListaConversas.module.css';
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
    icone: <IconeProduto nome="vendas" tamanho={20} />,
  },
  {
    titulo: 'Reuniões',
    detalhe: 'agenda, registros e decisões',
    icone: <IconeProduto nome="reunioes" tamanho={20} />,
  },
  {
    titulo: 'Projetos',
    detalhe: 'tarefas, prazos e entregas',
    icone: <IconeProduto nome="projetos" tamanho={20} />,
  },
  {
    titulo: 'Aprendizado',
    detalhe: 'formações e projetos guiados',
    icone: <IconeProduto nome="formacoes" tamanho={20} />,
  },
] as const;

type ConversaCarregada = {
  thread: ThreadDoConsultor;
  mensagens: MensagemDoConsultor[];
  mensagemAvulsa?: string;
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
  modoPreview = false,
  dono,
  chaveRascunho,
  totalConversas = threads.length,
  mensagemEmFoco,
}: {
  threads: ThreadDoConsultor[];
  conversa: ConversaCarregada;
  contextoInicial?: ContextoSobralTarefa | null;
  nome?: string | null;
  modoPreview?: boolean;
  dono?: string;
  chaveRascunho?: string;
  totalConversas?: number;
  mensagemEmFoco?: string;
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
              <IconeProduto nome="sobral" />
            </span>
            <div>
              <h1 id="titulo-sobral">
                {conversa ? tituloLegivel(conversa.thread.titulo) : 'Nova conversa'}
              </h1>
              <p>Sobral AI · consultor do seu trabalho</p>
            </div>
          </div>

          <div className={styles.acoes}>
            {conversa && dono ? (
              <BuscaMensagens
                key={`busca:${dono}:${conversa.thread.id}`}
                conversa={conversa.thread.id}
                dono={dono}
              />
            ) : null}
            {conversa && dono ? (
              <ArquivosConversa
                key={`${dono}:${conversa.thread.id}`}
                conversa={conversa.thread.id}
                dono={dono}
              />
            ) : null}
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
                  {FONTES_DO_CONTEXTO.map((fonte) => (
                    <li key={fonte.titulo}>
                      {fonte.icone}
                      <span>
                        <strong>{fonte.titulo}</strong>
                        <small>{fonte.detalhe}</small>
                      </span>
                    </li>
                  ))}
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
            <HistoricoDropdown
              emPortal
              compactoNoCelular={Boolean(conversa && dono)}
              total={totalConversas}
              rotulo="Conversas"
              painelClassName={historicoStyles.painel}
            >
              <BibliotecaConversas dono={dono}>
                <ListaConversas
                  key={dono ?? 'preview'}
                  dono={dono}
                  total={totalConversas}
                  threads={threads}
                  atualId={conversa?.thread.id}
                />
              </BibliotecaConversas>
            </HistoricoDropdown>
          </div>
        </header>

        <div className={styles.areaChat}>
          <Conversa
            key={`${dono ?? 'preview'}:${conversa?.thread.id ?? chaveRascunho ?? 'nova'}`}
            dono={dono}
            chaveRascunho={chaveRascunho}
            threadId={conversa?.thread.id}
            pendente={ultima?.papel === 'usuario'}
            ultimaMensagemId={ultima?.id}
            mensagemEmFoco={mensagemEmFoco}
            exemplos={vazio && !contextoInicial ? EXEMPLOS : undefined}
            textoInicial={contextoInicial?.mensagem}
            historico={
              !vazio ? (
                <Mensagens
                  dono={dono}
                  mensagens={mensagens}
                  modoPreview={modoPreview}
                  mensagemAvulsa={conversa?.mensagemAvulsa}
                />
              ) : undefined
            }
            boasVindas={
              vazio ? (
                <div className={styles.boasVindas}>
                  {contextoInicial ? (
                    <p className={styles.eyebrow}>Tarefa de {contextoInicial.empresa}</p>
                  ) : (
                    <span className={styles.assinatura} aria-hidden="true">
                      <IconeProduto nome="sobral" tamanho={32} />
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
              ) : undefined
            }
          />
        </div>
      </section>
    </div>
  );
}

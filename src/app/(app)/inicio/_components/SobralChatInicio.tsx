import { Bot, Link2, RefreshCw } from 'lucide-react';
import { Conversa, type ExemploDoConsultor } from '../../consultor/_components/Conversa';
import { Mensagens } from '../../consultor/_components/Mensagens';
import { obterConversaRecente, type MensagemDoConsultor } from '@/lib/consultor/queries';
import type { JornadaOperacional } from '@/lib/jornada/queries';
import { HistoricoChat } from './HistoricoChat';
import styles from './SobralChatInicio.module.css';

function exemplosDa(jornada: JornadaOperacional): ExemploDoConsultor[] {
  const passo = jornada.plano.proximoPasso;
  const exemplos: ExemploDoConsultor[] = [
    {
      rotulo: 'O que faço agora?',
      texto: `O que devo fazer agora para concluir "${passo.titulo}" sem pular nenhuma etapa importante?`,
    },
    {
      rotulo: 'Indique uma aula',
      texto: 'Qual aula da plataforma pode me ajudar no problema que estou trabalhando agora?',
    },
    {
      rotulo: 'Escolha uma ferramenta',
      texto:
        'Qual ferramenta dos projetos da plataforma faz sentido para o meu próximo passo e por quê?',
    },
  ];
  return exemplos;
}

export function SobralChatVisual({
  mensagens,
  threadId,
  pendente = false,
  exemplos,
}: {
  mensagens: MensagemDoConsultor[];
  threadId?: string;
  pendente?: boolean;
  exemplos: ExemploDoConsultor[];
}) {
  return (
    <section id="sobral-ai" className={styles.secao} aria-labelledby="titulo-sobral-ai">
      <header className={styles.cabecalho}>
        <span className={styles.glifo} aria-hidden="true">
          <Bot size={21} strokeWidth={1.75} />
        </span>
        <div>
          <p>Sobral AI</p>
          <h2 id="titulo-sobral-ai">O que você precisa resolver agora?</h2>
          <span>
            Pergunte sobre uma venda ou implementação. Eu uso o que já aconteceu na plataforma para
            indicar a próxima ação, uma aula, um projeto ou uma ferramenta.
          </span>
        </div>
        <small>
          <Link2 size={14} strokeWidth={1.8} aria-hidden="true" /> Seu contexto já está conectado
        </small>
      </header>

      <div className={styles.chat}>
        <HistoricoChat>
          {mensagens.length > 0 ? (
            <Mensagens mensagens={mensagens.slice(-4)} compacto />
          ) : (
            <div className={styles.boasVindasChat}>
              <span aria-hidden="true">
                <Bot size={18} strokeWidth={1.8} />
              </span>
              <p>
                Posso ajudar a preparar uma venda, escolher uma aula ou organizar o próximo passo de
                um projeto.
              </p>
            </div>
          )}
        </HistoricoChat>

        <div className={styles.compositor}>
          <Conversa
            threadId={threadId}
            pendente={pendente}
            ultimaMensagemId={mensagens[mensagens.length - 1]?.id}
            exemplos={mensagens.length === 0 ? exemplos : undefined}
          />
        </div>
      </div>
    </section>
  );
}

export async function SobralChatInicio({ jornada }: { jornada: JornadaOperacional }) {
  const resultado = await carregarConversaRecente();
  if (!resultado.ok) return <SobralChatInicioFalhou />;

  const conversa = resultado.conversa;
  const mensagens = conversa?.mensagens ?? [];
  const ultima = mensagens[mensagens.length - 1];

  return (
    <SobralChatVisual
      mensagens={mensagens}
      threadId={conversa?.thread.id}
      pendente={ultima?.papel === 'usuario'}
      exemplos={exemplosDa(jornada)}
    />
  );
}

async function carregarConversaRecente(): Promise<
  { ok: true; conversa: Awaited<ReturnType<typeof obterConversaRecente>> } | { ok: false }
> {
  try {
    return { ok: true, conversa: await obterConversaRecente() };
  } catch (causa) {
    /* O Sobral é parte da Início, mas não pode derrubar a Início. Se a leitura
       do histórico falhar, isolamos o problema e mantemos o restante da
       plataforma utilizável. O histórico permanece intacto no banco. */
    console.error('[sobral:inicio] falha ao carregar a conversa:', causa);
    return { ok: false };
  }
}

function SobralChatInicioFalhou() {
  return (
    <section id="sobral-ai" className={styles.secao} aria-labelledby="titulo-sobral-ai-falha">
      <div className={styles.estadoFalha} role="alert">
        <span className={styles.glifo} aria-hidden="true">
          <Bot size={21} strokeWidth={1.75} />
        </span>
        <div>
          <p>Sobral AI</p>
          <h2 id="titulo-sobral-ai-falha">O chat não carregou desta vez.</h2>
          <span>Seu histórico continua salvo. Atualize esta área para tentar novamente.</span>
        </div>
        <a href="/inicio#sobral-ai" className={styles.acaoFalha}>
          <RefreshCw size={15} strokeWidth={2} aria-hidden="true" />
          Tentar novamente
        </a>
      </div>
    </section>
  );
}

export function SobralChatInicioCarregando() {
  return (
    <section id="sobral-ai" className={`${styles.secao} ${styles.carregando}`} aria-busy="true">
      <div className={styles.linhaCurta} />
      <div className={styles.linhaTitulo} />
      <div className={styles.caixaCarregando} />
    </section>
  );
}

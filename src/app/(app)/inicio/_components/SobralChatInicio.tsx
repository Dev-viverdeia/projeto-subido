import { Bot, Sparkles } from 'lucide-react';
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
          <h2 id="titulo-sobral-ai">Converse sobre o que precisa fazer.</h2>
          <span>
            Tire uma dúvida de venda ou implementação. O chat usa seu progresso para indicar aulas,
            projetos, ferramentas e a próxima tarefa.
          </span>
        </div>
        <small>
          <Sparkles size={14} strokeWidth={1.8} aria-hidden="true" /> Usa seus dados da plataforma
        </small>
      </header>

      <div className={styles.chat}>
        <HistoricoChat>
          {mensagens.length > 0 ? (
            <Mensagens mensagens={mensagens.slice(-16)} />
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
          <Conversa threadId={threadId} pendente={pendente} exemplos={exemplos} />
        </div>
      </div>
    </section>
  );
}

export async function SobralChatInicio({ jornada }: { jornada: JornadaOperacional }) {
  const conversa = await obterConversaRecente();
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

export function SobralChatInicioCarregando() {
  return (
    <section id="sobral-ai" className={`${styles.secao} ${styles.carregando}`} aria-busy="true">
      <div className={styles.linhaCurta} />
      <div className={styles.linhaTitulo} />
      <div className={styles.caixaCarregando} />
    </section>
  );
}

import { CabecalhoPagina } from '@/app/(app)/_components/CabecalhoPagina';
import { HistoricoDropdown } from '@/app/(app)/_components/HistoricoDropdown';
import { SobralChatVisual } from '@/app/(app)/inicio/_components/SobralChatInicio';
import type { ExemploDoConsultor } from './Conversa';
import type { MensagemDoConsultor, ThreadDoConsultor } from '@/lib/consultor/queries';
import { ListaConversas } from './ListaConversas';
import styles from './TelaSobral.module.css';

const EXEMPLOS: ExemploDoConsultor[] = [
  {
    rotulo: 'O que faço agora?',
    texto:
      'Olhe o que já aconteceu na minha plataforma e me diga qual é a ação mais importante para eu executar agora.',
  },
  {
    rotulo: 'Indique uma aula',
    texto:
      'Qual aula da plataforma pode me ajudar no problema mais importante que estou trabalhando agora?',
  },
  {
    rotulo: 'Projeto ou ferramenta',
    texto:
      'Qual projeto ou ferramenta da plataforma faz sentido para o meu momento e o que eu devo fazer primeiro?',
  },
];

type ConversaCarregada = {
  thread: ThreadDoConsultor;
  mensagens: MensagemDoConsultor[];
} | null;

/**
 * A superfície completa do Sobral AI. O chat da Início e esta tela usam a
 * mesma conversa: muda o espaço disponível, nunca a memória do consultor.
 */
export function TelaSobral({
  threads,
  conversa,
}: {
  threads: ThreadDoConsultor[];
  conversa: ConversaCarregada;
}) {
  const mensagens = conversa?.mensagens ?? [];
  const ultima = mensagens[mensagens.length - 1];

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Sobral AI" oculto />
      <SobralChatVisual
        completo
        mensagens={mensagens}
        threadId={conversa?.thread.id}
        pendente={ultima?.papel === 'usuario'}
        exemplos={EXEMPLOS}
        acaoCabecalho={
          <HistoricoDropdown total={threads.length} rotulo="Conversas">
            {threads.length > 0 ? (
              <ListaConversas threads={threads} atualId={conversa?.thread.id} />
            ) : (
              <p className={styles.semHistorico}>Sua primeira conversa aparecerá aqui.</p>
            )}
          </HistoricoDropdown>
        }
      />
    </div>
  );
}

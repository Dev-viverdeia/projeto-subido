import type { Metadata } from 'next';
import { listarThreads } from '@/lib/consultor/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { HistoricoDropdown } from '../_components/HistoricoDropdown';
import entrada from '../_components/entrada.module.css';
import { Conversa, type ExemploDoConsultor } from './_components/Conversa';
import { ListaConversas } from './_components/ListaConversas';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Sobral AI' };

/**
 * O CONSULTOR — a tela inicial é a pergunta, e o histórico é uma SEÇÃO da
 * página, não um canto: quem volta ao consultor volta quase sempre para
 * retomar uma conversa, e escondê-las num dropdown fazia a tela parecer sem
 * memória. Sem conversa nenhuma, a seção some — a pergunta fica sozinha, que
 * é o estado certo de uma tela de criação (mesma regra do Builder).
 */
const EXEMPLOS: ExemploDoConsultor[] = [
  {
    rotulo: 'Atendimento fora do horário',
    texto:
      'Meu cliente perde atendimento fora do horário comercial no WhatsApp. Qual solução do catálogo resolve isso e por onde eu começo?',
  },
  {
    rotulo: 'Primeiro projeto',
    texto:
      'Quero fechar meu primeiro projeto de IA como implementador. Qual solução do catálogo é a porta de entrada mais simples de vender e implantar?',
  },
  {
    rotulo: 'Não está no catálogo',
    texto:
      'Meu cliente pediu um sistema que não vejo no catálogo. Como uso o Estúdio para transformar essa ideia num projeto completo?',
  },
];

export default async function ConsultorPage() {
  const threads = await listarThreads();

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Sobral AI" oculto />

      {/* O canto vive SEMPRE, mesmo sem conversa — o controle sumir lia como
          "a tela não tem memória". Vazio, o painel diz o estado em uma linha
          em vez de fingir que a seção não existe. */}
      <div className={`${entrada.bloco} ${styles.topoDireito}`}>
        <HistoricoDropdown total={threads.length} rotulo="Suas conversas">
          {threads.length > 0 ? (
            <ListaConversas threads={threads} />
          ) : (
            <p className={styles.semConversas}>
              Nenhuma conversa ainda — a primeira nasce quando você enviar uma pergunta.
            </p>
          )}
        </HistoricoDropdown>
      </div>

      <div className={`${entrada.bloco} ${styles.tela}`}>
        <header className={styles.cabecalho}>
          <p className={styles.eyebrow}>Sobral AI</p>
          <h2 className={styles.titulo}>
            Qual é a <em>dúvida</em> do momento?
          </h2>
          <p className={styles.apoio}>
            Contexto do seu caso, caminho de implementação, qual solução do catálogo serve.{' '}
            <em>Uma pergunta por vez funciona melhor.</em>
          </p>
        </header>

        <Conversa exemplos={EXEMPLOS} />
      </div>

      {threads.length > 0 ? (
        <section
          className={`${entrada.bloco} ${entrada.atraso1} ${styles.historico}`}
          aria-labelledby="consultor-conversas"
        >
          <h3 id="consultor-conversas" className={styles.historicoTitulo}>
            Conversas recentes
            <span className={styles.total}>{threads.length}</span>
          </h3>
          <ListaConversas threads={threads} />
        </section>
      ) : null}
    </div>
  );
}

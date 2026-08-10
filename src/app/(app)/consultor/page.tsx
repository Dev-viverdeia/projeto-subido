import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Check,
  Circle,
  Database,
  FileCheck2,
  MessageSquareText,
  Radio,
  Target,
} from 'lucide-react';
import { ETAPAS_SOBRAL, indiceDaEtapa } from '@/lib/consultor/direcao';
import { listarThreads, obterPainelSobral } from '@/lib/consultor/queries';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { HistoricoDropdown } from '../_components/HistoricoDropdown';
import entrada from '../_components/entrada.module.css';
import { AtualizarDirecao } from './_components/AtualizarDirecao';
import { Conversa, type ExemploDoConsultor } from './_components/Conversa';
import { ListaConversas } from './_components/ListaConversas';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Sobral AI' };

const EXEMPLOS: ExemploDoConsultor[] = [
  {
    rotulo: 'Próximo passo',
    texto:
      'Com base na minha operação, o que eu deveria executar primeiro e qual evidência mostra que terminei?',
  },
  {
    rotulo: 'Lead em foco',
    texto:
      'Analise meu lead em foco e diga o que ainda falta descobrir antes de eu apresentar uma proposta.',
  },
  {
    rotulo: 'Projeto certo',
    texto: 'Qual projeto padrão combina melhor com o momento da minha operação e por quê?',
  },
];

function dataDaLeitura(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

export default async function ConsultorPage() {
  const [threads, painel] = await Promise.all([listarThreads(), obterPainelSobral()]);
  const { plano, sinais } = painel;
  const indiceAtual = indiceDaEtapa(plano.etapa);
  const registros =
    sinais.oportunidades.total + sinais.calls.total + sinais.propostas.total + sinais.studio.total;
  const vendas = Math.max(sinais.oportunidades.ganhas, sinais.propostas.aceitas);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Sobral AI" oculto />

      <header className={`${entrada.bloco} ${styles.topo}`}>
        <div className={styles.introducao}>
          <p className={styles.eyebrow}>Sobral AI · direção operacional</p>
          <h1 className={styles.titulo}>Seu próximo movimento, com prova.</h1>
          <p className={styles.apoio}>
            O Sobral AI cruza o que já aconteceu no CRM, nas calls, nos projetos e nas propostas
            para orientar o que fazer agora.
          </p>
        </div>

        <div className={styles.comandos}>
          <AtualizarDirecao geradoPorIA={painel.geradoPorIA} desatualizado={painel.desatualizado} />
          <HistoricoDropdown total={threads.length} rotulo="Suas conversas">
            {threads.length > 0 ? (
              <ListaConversas threads={threads} />
            ) : (
              <p className={styles.semConversas}>Sua primeira conversa aparecerá aqui.</p>
            )}
          </HistoricoDropdown>
        </div>
      </header>

      <main className={`${entrada.bloco} ${entrada.atraso1} ${styles.mesa}`}>
        <nav className={styles.trilho} aria-label="Etapa atual da operação">
          <div className={styles.trilhoCabecalho}>
            <span>Linha de avanço</span>
            <strong>{String(indiceAtual + 1).padStart(2, '0')} / 05</strong>
          </div>
          <ol className={styles.etapas}>
            {ETAPAS_SOBRAL.map((etapa, indice) => {
              const atual = etapa.id === plano.etapa;
              const concluida = indice < indiceAtual;
              return (
                <li
                  key={etapa.id}
                  className={`${styles.etapa} ${atual ? styles.etapaAtual : ''} ${
                    concluida ? styles.etapaConcluida : ''
                  }`}
                  aria-current={atual ? 'step' : undefined}
                >
                  <span className={styles.marcador} aria-hidden="true">
                    {concluida ? (
                      <Check size={12} strokeWidth={2.6} />
                    ) : atual ? (
                      <Circle size={10} />
                    ) : null}
                  </span>
                  <span className={styles.etapaTexto}>
                    <small>{etapa.numero}</small>
                    <strong>{etapa.titulo}</strong>
                    <em>{etapa.marco}</em>
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <article className={styles.direcao} data-on-dark>
          <div className={styles.direcaoTopo}>
            <span className={styles.seloDirecao}>
              <Radio size={13} strokeWidth={2} aria-hidden="true" /> Direção de agora
            </span>
            <span className={styles.atualizado}>
              {painel.geradoPorIA ? 'Leitura da IA' : 'Leitura factual'} ·{' '}
              {dataDaLeitura(plano.geradoEm)}
            </span>
          </div>

          <div className={styles.foco}>
            <p>{plano.foco}</p>
            <h2>{plano.proximoPasso.titulo}</h2>
            <span>{plano.diagnostico}</span>
          </div>

          <div className={styles.prova}>
            <span className={styles.provaIcone} aria-hidden="true">
              <FileCheck2 size={18} strokeWidth={1.9} />
            </span>
            <span>
              <small>Você saberá que avançou quando</small>
              <strong>{plano.proximoPasso.evidencia}</strong>
            </span>
          </div>

          <Link href={plano.proximoPasso.destino} className={styles.acaoPrincipal}>
            Executar próximo passo
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </article>

        <aside className={styles.leitura}>
          <div className={styles.leituraTitulo}>
            <Database size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>
              <strong>Leitura da operação</strong>
              <small>{registros} registros considerados</small>
            </span>
          </div>

          <dl className={styles.metricas}>
            <div>
              <dt>Oportunidades abertas</dt>
              <dd>{sinais.oportunidades.abertas}</dd>
            </div>
            <div>
              <dt>Calls concluídas</dt>
              <dd>{sinais.calls.concluidas}</dd>
            </div>
            <div>
              <dt>Propostas</dt>
              <dd>{sinais.propostas.total}</dd>
            </div>
            <div>
              <dt>Vendas comprovadas</dt>
              <dd>{vendas}</dd>
            </div>
          </dl>

          <div className={styles.fonteFoco}>
            <Target size={16} strokeWidth={1.9} aria-hidden="true" />
            <span>
              <small>Oportunidade em foco</small>
              <strong>{sinais.foco?.empresa ?? 'Nenhuma oportunidade aberta'}</strong>
              <em>{sinais.foco?.proximaAcao ?? 'O CRM ainda não tem uma próxima ação.'}</em>
            </span>
          </div>
        </aside>
      </main>

      <section
        id="pergunte-sobral"
        className={`${entrada.bloco} ${entrada.atraso2} ${styles.pergunte}`}
      >
        <header className={styles.pergunteCabecalho}>
          <span className={styles.iconePergunta} aria-hidden="true">
            <Bot size={22} strokeWidth={1.8} />
          </span>
          <div>
            <p className={styles.eyebrow}>Converse com sua direção</p>
            <h2>Pergunte sem tirar os olhos do plano.</h2>
            <span>
              A resposta usa o mesmo contexto acima e pode atualizar sua direção automaticamente.
            </span>
          </div>
        </header>
        <Conversa exemplos={EXEMPLOS} />
      </section>

      <section className={`${entrada.bloco} ${styles.plano}`}>
        <header className={styles.secaoCabecalho}>
          <div>
            <p className={styles.eyebrow}>Plano em ordem</p>
            <h2>Três ações. Uma frente por vez.</h2>
          </div>
          <p>
            A evidência encerra cada ação e impede que “trabalhar nisso” vire estado permanente.
          </p>
        </header>

        <ol className={styles.acoesPlano}>
          {plano.acoes.map((acao, indice) => (
            <li key={`${acao.titulo}-${indice}`} className={styles.acaoCard}>
              <div className={styles.acaoIndice}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                {indice === 0 ? <em>Agora</em> : null}
              </div>
              <div className={styles.acaoConteudo}>
                <h3>{acao.titulo}</h3>
                <p>{acao.detalhe}</p>
                <small>{acao.evidencia}</small>
              </div>
              <Link
                href={acao.destino}
                className={styles.acaoLink}
                aria-label={`Abrir: ${acao.titulo}`}
              >
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {threads.length > 0 ? (
        <section
          className={`${entrada.bloco} ${styles.historico}`}
          aria-labelledby="conversas-recentes"
        >
          <h2 id="conversas-recentes">
            <MessageSquareText size={18} strokeWidth={1.8} aria-hidden="true" />
            Conversas recentes
            <span>{threads.length}</span>
          </h2>
          <ListaConversas threads={threads} />
        </section>
      ) : null}
    </div>
  );
}

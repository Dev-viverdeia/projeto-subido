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
import { CabecalhoPagina } from '@/app/(app)/_components/CabecalhoPagina';
import { HistoricoDropdown } from '@/app/(app)/_components/HistoricoDropdown';
import entrada from '@/app/(app)/_components/entrada.module.css';
import { ETAPAS_SOBRAL, indiceDaEtapa, type AcaoSobral } from '@/lib/consultor/direcao';
import { resolverAcaoSobral } from '@/lib/consultor/destino';
import type { PainelSobral, ThreadDoConsultor } from '@/lib/consultor/queries';
import { AtualizarDirecao } from './AtualizarDirecao';
import { Conversa, type ExemploDoConsultor } from './Conversa';
import { ListaConversas } from './ListaConversas';
import { RadarOperacional } from './RadarOperacional';
import styles from '../pagina.module.css';

function dataDaLeitura(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
}

function mesmaAcao(a: AcaoSobral, b: AcaoSobral): boolean {
  return a.titulo === b.titulo && a.destino === b.destino;
}

function exemplosDoPainel(painel: PainelSobral): ExemploDoConsultor[] {
  const principal = painel.sinais.radar[0];
  const lead = painel.sinais.foco;
  const projeto = painel.sinais.radar.find((item) => item.dominio === 'projetos');
  return [
    {
      rotulo: 'Prioridade de hoje',
      texto: principal
        ? `Explique por que "${principal.titulo}" é a prioridade agora e me dê a preparação mínima para executar sem abrir outra frente.`
        : 'Com base na minha operação, o que eu deveria executar primeiro e qual evidência mostra que terminei?',
    },
    {
      rotulo: 'Lead em foco',
      texto: lead
        ? `Analise a oportunidade de ${lead.empresa} e diga o que ainda falta confirmar antes do próximo avanço.`
        : 'Qual é o melhor primeiro movimento para criar uma oportunidade comercial com contexto?',
    },
    {
      rotulo: projeto ? 'Projeto em foco' : 'Projeto certo',
      texto: projeto
        ? `Revise o compromisso "${projeto.titulo}" e me diga como concluir com uma evidência clara para o cliente.`
        : 'Qual projeto padrão combina melhor com o momento da minha operação e por quê?',
    },
  ];
}

export function PainelSobralView({
  threads,
  painel,
}: {
  threads: ThreadDoConsultor[];
  painel: PainelSobral;
}) {
  const { plano, sinais } = painel;
  const indiceAtual = indiceDaEtapa(plano.etapa);
  const registros =
    sinais.oportunidades.total +
    sinais.calls.total +
    sinais.propostas.total +
    sinais.studio.total +
    sinais.projetos.total +
    sinais.projetos.acoesPendentes;
  const acaoPrincipal = resolverAcaoSobral(plano.proximoPasso, sinais);
  const acoesDepois = plano.acoes
    .filter((acao) => !mesmaAcao(acao, plano.proximoPasso))
    .slice(0, 2);
  const propostasEmCurso =
    sinais.propostas.rascunhos + sinais.propostas.prontas + sinais.propostas.apresentadas;

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Sobral AI" oculto />

      <header className={`${entrada.bloco} ${styles.topo}`}>
        <div className={styles.introducao}>
          <p className={styles.eyebrow}>Sobral AI · direção operacional</p>
          <h2 className={styles.titulo}>Seu próximo movimento, com prova.</h2>
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

          <Link href={acaoPrincipal.destino} className={styles.acaoPrincipal}>
            {acaoPrincipal.rotulo}
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </article>

        <aside className={styles.leitura}>
          <div className={styles.leituraTitulo}>
            <Database size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>
              <strong>Base da decisão</strong>
              <small>{registros} registros conectados</small>
            </span>
          </div>

          <dl className={styles.metricas}>
            <div>
              <dt>Oportunidades abertas</dt>
              <dd>{sinais.oportunidades.abertas}</dd>
            </div>
            <div>
              <dt>Calls agendadas</dt>
              <dd>{sinais.calls.agendadas}</dd>
            </div>
            <div>
              <dt>Propostas em curso</dt>
              <dd>{propostasEmCurso}</dd>
            </div>
            <div>
              <dt>Ações vencidas</dt>
              <dd>{sinais.projetos.acoesAtrasadas}</dd>
            </div>
          </dl>

          {sinais.foco ? (
            <Link href={`/crm/${sinais.foco.oportunidadeId}`} className={styles.fonteFoco}>
              <Target size={16} strokeWidth={1.9} aria-hidden="true" />
              <span>
                <small>Oportunidade em foco</small>
                <strong>{sinais.foco.empresa}</strong>
                <em>{sinais.foco.proximaAcao ?? 'O CRM ainda não tem uma próxima ação.'}</em>
              </span>
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </Link>
          ) : (
            <div className={styles.fonteFoco}>
              <Target size={16} strokeWidth={1.9} aria-hidden="true" />
              <span>
                <small>Oportunidade em foco</small>
                <strong>Nenhuma oportunidade aberta</strong>
                <em>O CRM ainda não tem uma próxima ação.</em>
              </span>
            </div>
          )}
        </aside>
      </main>

      <RadarOperacional itens={sinais.radar} />

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
            <span>A resposta usa o radar acima e pode atualizar sua direção automaticamente.</span>
          </div>
        </header>
        <Conversa exemplos={exemplosDoPainel(painel)} />
      </section>

      {acoesDepois.length > 0 ? (
        <section className={`${entrada.bloco} ${styles.plano}`}>
          <header className={styles.secaoCabecalho}>
            <div>
              <p className={styles.eyebrow}>Depois do movimento atual</p>
              <h2>O restante fica em espera.</h2>
            </div>
            <p>
              Conclua a evidência de agora antes de abrir a próxima frente. O plano se recalcula
              quando os fatos mudam.
            </p>
          </header>

          <ol className={styles.acoesPlano}>
            {acoesDepois.map((acao, indice) => {
              const destino = resolverAcaoSobral(acao, sinais);
              return (
                <li key={`${acao.titulo}-${indice}`} className={styles.acaoCard}>
                  <div className={styles.acaoIndice}>
                    <span>{String(indice + 2).padStart(2, '0')}</span>
                  </div>
                  <div className={styles.acaoConteudo}>
                    <h3>{acao.titulo}</h3>
                    <p>{acao.detalhe}</p>
                    <small>{acao.evidencia}</small>
                  </div>
                  <Link href={destino.destino} className={styles.acaoLink}>
                    <span>{destino.rotulo}</span>
                    <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

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

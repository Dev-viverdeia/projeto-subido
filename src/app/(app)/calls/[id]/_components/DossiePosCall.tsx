import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Clock3,
  ContactRound,
  Lightbulb,
  MessageSquareQuote,
  Radar,
  Target,
} from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import { ROTULO_STATUS_CALL, ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import { ROTULO_ETAPA } from '@/lib/crm/etapas';
import { CentralPlanoCall } from './CentralPlanoCall';
import { GravacaoCall } from './GravacaoCall';
import { ListaFactual, MapaFactual } from './MapaFactual';
import { RetornoProximaAcao } from './RetornoProximaAcao';
import { TranscricaoCall } from './TranscricaoCall';
import styles from '../pagina.module.css';

const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});
const HORA = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const ROTULO_SENTIMENTO: Record<string, string> = {
  positivo: 'abertura positiva',
  neutro: 'posição neutra',
  cauteloso: 'avanço com cautela',
  negativo: 'resistência percebida',
  indefinido: 'sinal ainda indefinido',
};

function duracao(posCall: PosCall): string {
  const segundosTranscricao = posCall.transcricao?.duracaoSegundos;
  if (segundosTranscricao && segundosTranscricao > 0) {
    return `${Math.max(1, Math.round(segundosTranscricao / 60))} min`;
  }
  const inicio = posCall.reuniao.iniciadaEm;
  const fim = posCall.reuniao.encerradaEm;
  if (inicio && fim) {
    const minutos = Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60_000);
    if (minutos > 0) return `${minutos} min`;
  }
  return `${posCall.reuniao.duracaoMinutos} min previstos`;
}

function minuto(segundo: number | null): string {
  if (segundo === null) return 'durante a call';
  const minutos = Math.floor(segundo / 60);
  const segundos = segundo % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function estadoDaAnalise(posCall: PosCall) {
  if (posCall.analise?.status === 'concluida' && posCall.analise.resumo) {
    return { rotulo: 'Leitura pronta', tipo: 'pronta' } as const;
  }
  if (posCall.analise?.status === 'falhou') {
    return { rotulo: 'Revisão manual', tipo: 'falhou' } as const;
  }
  if (posCall.analise?.status === 'sem_conteudo') {
    return { rotulo: 'Sem conteúdo', tipo: 'sem_conteudo' } as const;
  }
  if (posCall.reuniao.status === 'cancelada') {
    return { rotulo: 'Call cancelada', tipo: 'indisponivel' } as const;
  }
  return { rotulo: 'Processando', tipo: 'processando' } as const;
}

function IconeEstado({ tipo }: { tipo: ReturnType<typeof estadoDaAnalise>['tipo'] }) {
  if (tipo === 'pronta') return <BadgeCheck size={14} aria-hidden="true" />;
  if (tipo === 'falhou') return <CircleAlert size={14} aria-hidden="true" />;
  if (tipo === 'sem_conteudo') return <CircleHelp size={14} aria-hidden="true" />;
  if (tipo === 'indisponivel') return <CircleHelp size={14} aria-hidden="true" />;
  return <Radar size={14} aria-hidden="true" />;
}

export function DossiePosCall({
  posCall,
  estadoAcao,
}: {
  posCall: PosCall;
  estadoAcao: string | null;
}) {
  const analise = posCall.analise;
  const estado = estadoDaAnalise(posCall);
  const pontosAbertos = analise?.lacunas.length ?? 0;
  const acaoJaSincronizada = posCall.sincronizacao.acoesPlano.find(
    (acao) => acao.categoria === 'proxima_acao',
  )?.titulo;
  const acaoSugerida =
    acaoJaSincronizada ?? analise?.proximosPassos[0] ?? posCall.oportunidade.proximaAcao ?? '';
  const nota = analise?.notaComercial;
  const sentimento = analise?.sentimento
    ? (ROTULO_SENTIMENTO[analise.sentimento] ?? analise.sentimento)
    : 'sem leitura suficiente';
  const temAnalise = estado.tipo === 'pronta';
  return (
    <div className={styles.pagina}>
      <nav className={styles.navegacao} aria-label="Navegação do pós-call">
        <Link href="/calls">
          <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
          Voltar às calls
        </Link>
        <span>
          {DATA.format(new Date(posCall.reuniao.agendadaPara))} ·{' '}
          {HORA.format(new Date(posCall.reuniao.agendadaPara))}
        </span>
      </nav>

      <header className={styles.hero} data-on-dark>
        <div className={styles.heroTopo}>
          <div className={styles.heroTitulo}>
            <div className={styles.sobretituloHero}>
              <IconeEstado tipo={estado.tipo} />
              Pós-call inteligente · {estado.rotulo}
            </div>
            <h1>{posCall.reuniao.titulo}</h1>
            <p>
              {posCall.empresa.nome}
              {posCall.contato ? ` · ${posCall.contato.nome}` : ''}
            </p>
          </div>
          <div className={styles.heroEstado}>
            <small>{ROTULO_TIPO_CALL[posCall.reuniao.tipo]}</small>
            <strong>{ROTULO_STATUS_CALL[posCall.reuniao.status]}</strong>
          </div>
        </div>

        <div className={styles.heroDecisao}>
          <div>
            <small>Próximo passo sugerido</small>
            <strong>{acaoSugerida || 'Definir o próximo passo com revisão humana'}</strong>
          </div>
          <a href="#plano-da-call">
            Revisar antes de aplicar <ChevronRight size={15} aria-hidden="true" />
          </a>
        </div>

        <div className={styles.heroMeta}>
          <span>
            <Clock3 size={14} aria-hidden="true" /> {duracao(posCall)}
          </span>
          <span>
            <ContactRound size={14} aria-hidden="true" />{' '}
            {posCall.contato?.cargo ?? 'Contato sem cargo informado'}
          </span>
          <span>
            <Target size={14} aria-hidden="true" /> {ROTULO_ETAPA[posCall.oportunidade.etapa]}
          </span>
        </div>
      </header>

      <RetornoProximaAcao estado={estadoAcao} />

      <section className={styles.leitura} aria-labelledby="leitura-titulo">
        <div className={styles.leituraCorpo}>
          <div className={styles.leituraTopo}>
            <div>
              <p className={styles.sobretitulo}>Resumo da call</p>
              <h2 id="leitura-titulo">O que ficou claro nesta conversa</h2>
            </div>
            {nota !== null && nota !== undefined && (
              <div className={styles.nota} aria-label={`Leitura comercial ${nota} de 100`}>
                <strong>{nota}</strong>
                <span>/100</span>
              </div>
            )}
          </div>
          {temAnalise ? (
            <p className={styles.resumo}>{analise?.resumo}</p>
          ) : estado.tipo === 'falhou' ? (
            <div className={styles.estadoLeitura}>
              <CircleAlert size={19} aria-hidden="true" />
              <div>
                <strong>
                  A conversa foi preservada, mas a leitura automática não ficou pronta.
                </strong>
                <p>
                  {analise?.erro ?? 'Use a transcrição abaixo para revisar os fatos manualmente.'}
                </p>
              </div>
            </div>
          ) : estado.tipo === 'sem_conteudo' ? (
            <div className={styles.estadoLeitura}>
              <CircleHelp size={19} aria-hidden="true" />
              <div>
                <strong>A call terminou sem conversa suficiente para uma leitura.</strong>
                <p>O histórico foi preservado sem inventar decisões, dores ou próximos passos.</p>
              </div>
            </div>
          ) : estado.tipo === 'indisponivel' ? (
            <div className={styles.estadoLeitura}>
              <CircleAlert size={19} aria-hidden="true" />
              <div>
                <strong>Esta call foi cancelada antes de gerar conteúdo.</strong>
                <p>O vínculo com o lead permanece no histórico, sem conclusões artificiais.</p>
              </div>
            </div>
          ) : (
            <div className={styles.estadoLeitura}>
              <Radar size={19} aria-hidden="true" />
              <div>
                <strong>A reunião ainda está sendo organizada.</strong>
                <p>Assim que a análise terminar, decisões e próximos passos aparecerão aqui.</p>
              </div>
            </div>
          )}
          <div className={styles.leituraRodape}>
            <span>Tom percebido: {sentimento}</span>
            <small>Leitura assistida por IA · valide antes de agir</small>
          </div>
        </div>
      </section>

      <CentralPlanoCall posCall={posCall} acaoSugerida={acaoSugerida} />

      <div className={styles.gradeOperacional}>
        <aside className={styles.lateral}>
          <section className={styles.lacunas} aria-labelledby="lacunas-titulo">
            <div className={styles.lacunasTopo}>
              <CircleHelp size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>{pontosAbertos}</span>
            </div>
            <p className={styles.sobretitulo}>Antes de prometer</p>
            <h2 id="lacunas-titulo">O que ainda falta saber</h2>
            <ListaFactual
              itens={analise?.lacunas ?? []}
              vazio="Nenhuma lacuna foi registrada. Ainda assim, revise escopo e responsáveis antes da proposta."
              variante="alerta"
            />
          </section>

          {analise?.sinaisCompra.length ? (
            <section className={styles.sinaisCompra} aria-labelledby="sinais-compra-titulo">
              <MessageSquareQuote size={18} strokeWidth={1.7} aria-hidden="true" />
              <p className={styles.sobretitulo}>Com evidência</p>
              <h2 id="sinais-compra-titulo">Sinais de avanço</h2>
              <ListaFactual
                itens={analise.sinaisCompra}
                vazio="Nenhum sinal explícito foi encontrado."
                variante="decisao"
              />
            </section>
          ) : null}
        </aside>

        <div className={styles.principal}>
          <MapaFactual analise={analise} temAnalise={temAnalise} />

          <section className={styles.oportunidades} aria-labelledby="oportunidades-titulo">
            <header className={styles.secaoTopo}>
              <div>
                <p>Hipóteses, não promessas</p>
                <h2 id="oportunidades-titulo">Oportunidades de Projeto</h2>
              </div>
              <Lightbulb size={20} strokeWidth={1.7} aria-hidden="true" />
            </header>
            {analise?.oportunidadesProjeto.length ? (
              <div className={styles.listaOportunidades}>
                {analise.oportunidadesProjeto.map((oportunidade, indice) => (
                  <article key={`${oportunidade}-${indice}`}>
                    <span>{String(indice + 1).padStart(2, '0')}</span>
                    <p>{oportunidade}</p>
                    <CircleHelp size={17} aria-label="Hipótese a validar" />
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.vazioSecao}>
                A conversa ainda não sustenta uma hipótese clara de Projeto. Isso é uma lacuna, não
                um sinal negativo.
              </p>
            )}
            <footer className={styles.oportunidadesRodape}>
              <p>
                Leve apenas hipóteses validadas para o escopo comercial. A continuidade desta call
                está centralizada no plano acima.
              </p>
            </footer>
          </section>

          {posCall.coach.length > 0 && (
            <details className={styles.coachRevisao}>
              <summary>
                <div>
                  <p>Aprendizado da condução</p>
                  <h2>Rever momentos do Live Coach</h2>
                </div>
                <span>
                  {posCall.coach.length} intervenções
                  <ChevronRight size={17} aria-hidden="true" />
                </span>
              </summary>
              <div className={styles.coachLinha}>
                {posCall.coach.map((sugestao) => (
                  <article key={sugestao.id} data-prioridade={sugestao.prioridade}>
                    <div className={styles.coachTempo}>{minuto(sugestao.segundoReuniao)}</div>
                    <div className={styles.coachPonto} aria-hidden="true" />
                    <div className={styles.coachConteudo}>
                      <div>
                        <span>{sugestao.categoria}</span>
                        {sugestao.metodologia && <small>{sugestao.metodologia}</small>}
                      </div>
                      <h3>{sugestao.titulo}</h3>
                      <p>{sugestao.sugestao}</p>
                      {sugestao.trechoGatilho && (
                        <blockquote>“{sugestao.trechoGatilho}”</blockquote>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </details>
          )}

          {posCall.gravacao && <GravacaoCall gravacao={posCall.gravacao} />}

          {posCall.transcricao && <TranscricaoCall transcricao={posCall.transcricao} />}
        </div>
      </div>
    </div>
  );
}

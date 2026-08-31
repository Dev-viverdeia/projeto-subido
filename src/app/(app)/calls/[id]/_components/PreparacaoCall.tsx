import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCheck,
  Clock3,
  ContactRound,
  FileSearch,
  MessageSquareText,
  Target,
  Video,
} from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import { ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import { ROTULO_ETAPA } from '@/lib/crm/etapas';
import styles from './PreparacaoCall.module.css';

const DATA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  timeZone: 'America/Sao_Paulo',
});

const HORA = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const ROTULO_MOMENTO = {
  contexto: 'Abrir',
  processo: 'Entender',
  impacto: 'Dimensionar',
  decisao: 'Avançar',
} as const;

export function PreparacaoCall({ posCall }: { posCall: PosCall }) {
  const plano = posCall.preparacao.plano;
  const data = new Date(posCall.reuniao.agendadaPara);

  return (
    <div className={styles.pagina}>
      <nav className={styles.navegacao} aria-label="Preparação da reunião">
        <Link href="/reunioes">
          <ArrowLeft size={15} aria-hidden="true" /> Voltar às reuniões
        </Link>
        <span>
          {posCall.preparacao.temEnriquecimento ? 'Plano personalizado' : 'Plano essencial'}
        </span>
      </nav>

      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoLinha}>
          <div>
            <p>Preparar reunião · {ROTULO_TIPO_CALL[posCall.reuniao.tipo]}</p>
            <h1>{posCall.reuniao.titulo}</h1>
            <span>
              {posCall.empresa.nome}
              {posCall.contato ? ` · ${posCall.contato.nome}` : ''}
            </span>
          </div>
          <div className={styles.acoesTopo}>
            <Link href={`/vendas/${posCall.oportunidade.id}`} className={styles.secundaria}>
              Ver ficha <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link href={`/sala/${posCall.reuniao.codigoPublico}`} className={styles.primaria}>
              <Video size={16} aria-hidden="true" /> Entrar na sala
            </Link>
          </div>
        </div>

        <section className={styles.resumo} aria-label="Contexto da reunião">
          <div>
            <CalendarDays size={16} aria-hidden="true" />
            <span>
              <small>Data e hora</small>
              <strong>
                {DATA.format(data)} · {HORA.format(data)}
              </strong>
            </span>
          </div>
          <div>
            <Clock3 size={16} aria-hidden="true" />
            <span>
              <small>Duração</small>
              <strong>{posCall.reuniao.duracaoMinutos} minutos</strong>
            </span>
          </div>
          <div>
            <ContactRound size={16} aria-hidden="true" />
            <span>
              <small>Contato</small>
              <strong>{posCall.contato?.cargo ?? 'Cargo não informado'}</strong>
            </span>
          </div>
          <div>
            <Target size={16} aria-hidden="true" />
            <span>
              <small>Etapa da venda</small>
              <strong>{ROTULO_ETAPA[posCall.oportunidade.etapa]}</strong>
            </span>
          </div>
        </section>
      </header>

      <section className={styles.plano} data-on-dark aria-labelledby="objetivo-call">
        <div className={styles.objetivo}>
          <p>Objetivo da reunião</p>
          <h2 id="objetivo-call">{plano.objetivo}</h2>
          <div className={styles.abertura}>
            <MessageSquareText size={17} aria-hidden="true" />
            <div>
              <small>Como abrir</small>
              <blockquote>“{plano.abertura}”</blockquote>
            </div>
          </div>
        </div>

        <div className={styles.fechamento}>
          <p>Sinal para avançar</p>
          <strong>{plano.fechamento.sinalParaAvancar}</strong>
          <span>“{plano.fechamento.frase}”</span>
        </div>
      </section>

      <div className={styles.grade}>
        <section className={styles.perguntas} aria-labelledby="perguntas-call">
          <header>
            <div>
              <p>Roteiro da conversa</p>
              <h2 id="perguntas-call">Perguntas para conduzir a descoberta</h2>
            </div>
            <span>{plano.perguntas.length} perguntas</span>
          </header>
          <ol>
            {plano.perguntas.map((item, indice) => (
              <li key={`${item.etapa}-${item.pergunta}`}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <small>{ROTULO_MOMENTO[item.etapa]}</small>
                  <strong>{item.pergunta}</strong>
                  <p>{item.intencao}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className={styles.contexto} aria-label="Informações para preparar a conversa">
          <section className={styles.painelContexto}>
            <header>
              <FileSearch size={17} aria-hidden="true" />
              <div>
                <p>Contexto confirmado</p>
                <h2>O que já sabemos</h2>
              </div>
            </header>
            {plano.fatos.length > 0 ? (
              <ul>
                {plano.fatos.map((fato) => (
                  <li key={fato}>{fato}</li>
                ))}
              </ul>
            ) : (
              <div className={styles.estadoBase}>
                <p>A ficha ainda não foi pesquisada.</p>
                <span>
                  O plano essencial continua pronto, mas uma pesquisa traz perguntas mais
                  específicas.
                </span>
                <Link href={`/vendas/${posCall.oportunidade.id}`}>Enriquecer na ficha</Link>
              </div>
            )}
            {(plano.hipoteses.length > 0 || plano.projetos.length > 0) && (
              <div className={styles.validacoes}>
                <header>
                  <CheckCheck size={17} aria-hidden="true" />
                  <div>
                    <p>Confirmar na call</p>
                    <h2>Pontos para validar</h2>
                  </div>
                </header>
                <ul>
                  {[...plano.hipoteses, ...plano.projetos].slice(0, 5).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.coachPronto}>
              <BadgeCheck size={18} aria-hidden="true" />
              <div>
                <strong>Live Coach pronto</strong>
                <span>Durante a reunião, ele usa este roteiro e o que o cliente disser.</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

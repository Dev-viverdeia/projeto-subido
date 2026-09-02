'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  FileSignature,
  KeyRound,
  Save,
  Video,
} from 'lucide-react';
import { definirPrazoProjeto, type EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { callPodeAbrir, ROTULO_STATUS_CALL } from '@/lib/calls/tipos';
import { formatarReais } from '@/lib/propostas/schema';
import styles from './InicioProjeto.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};

const DATA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

const DATA_ACEITE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

function dataParaCampo(valor: string | null): string {
  return valor ? new Date(valor).toISOString().slice(0, 10) : '';
}

export function InicioProjeto({
  projeto,
  briefingConfirmado,
  primeiraTarefa,
  onComecar,
}: {
  projeto: ProjetoExecucaoCompleto;
  briefingConfirmado: boolean;
  primeiraTarefa: string | null;
  onComecar: () => void;
}) {
  const [estadoPrazo, definirPrazo, salvandoPrazo] = useActionState(
    definirPrazoProjeto,
    ESTADO_INICIAL,
  );
  const kickoff = projeto.kickoff;
  const kickoffPodeAbrir = kickoff ? callPodeAbrir(kickoff.status) : false;
  const kickoffPronto = Boolean(
    kickoff && (kickoff.status === 'processando' || kickoff.status === 'concluida'),
  );
  const hrefKickoff = kickoff
    ? kickoffPodeAbrir
      ? `/sala/${kickoff.codigoPublico}`
      : kickoff.status === 'cancelada'
        ? `/reunioes?nova=1&oportunidade=${projeto.oportunidadeId}&tipo=kickoff`
        : `/reunioes/${kickoff.id}`
    : `/reunioes?nova=1&oportunidade=${projeto.oportunidadeId}&tipo=kickoff`;
  const prazoDefinido = Boolean(projeto.prazoEm);
  const prazoLiberado = briefingConfirmado && kickoffPronto;
  const preparacaoCompleta = briefingConfirmado && kickoffPronto && prazoDefinido;
  const etapasProntas = [kickoffPronto, briefingConfirmado, prazoDefinido].filter(Boolean).length;
  const pendencias = 3 - etapasProntas;
  const etapaAtual = !kickoffPronto
    ? 'kickoff'
    : !briefingConfirmado
      ? 'briefing'
      : !prazoDefinido
        ? 'prazo'
        : 'execucao';

  return (
    <section className={styles.inicio} aria-labelledby="inicio-projeto-titulo">
      <header className={styles.cabecalho}>
        <div>
          <p>Início do projeto</p>
          <h2 id="inicio-projeto-titulo">Venda confirmada. Prepare a entrega.</h2>
        </div>
        <span>
          {pendencias
            ? `${pendencias} pendente${pendencias === 1 ? '' : 's'}`
            : 'Pronto para executar'}
        </span>
      </header>

      <div className={styles.vendaConfirmada}>
        <span className={styles.iconeVenda} aria-hidden="true">
          <BadgeCheck size={22} strokeWidth={1.7} />
        </span>
        <div className={styles.vendaTexto}>
          <p>Venda confirmada</p>
          <strong>Proposta V{projeto.aceiteVenda.versao.toString().padStart(2, '0')} aceita</strong>
          <small>
            {projeto.aceiteVenda.aceitoPor
              ? `${projeto.aceiteVenda.aceitoPor} aprovou em `
              : 'Aprovação registrada em '}
            {DATA_ACEITE.format(new Date(projeto.aceiteVenda.aceitoEm))}.
          </small>
        </div>
        <dl className={styles.vendaResumo}>
          <div>
            <dt>Investimento</dt>
            <dd>{formatarReais(projeto.documento.investimento.valorCentavos)}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{projeto.documento.entregaveis.length} itens combinados</dd>
          </div>
        </dl>
        <Link href={`/propostas/${projeto.propostaId}`} className={styles.verProposta}>
          <FileSignature size={15} aria-hidden="true" /> Ver versão aceita
        </Link>
      </div>

      <ol className={styles.passos}>
        <li
          data-pronto={kickoffPronto || undefined}
          data-atual={etapaAtual === 'kickoff' || undefined}
        >
          <span className={styles.numero}>
            {kickoffPronto ? <Check size={13} aria-label="Concluído" /> : '01'}
          </span>
          <div className={styles.conteudo}>
            <p>Kickoff do projeto</p>
            <strong>{kickoff ? ROTULO_STATUS_CALL[kickoff.status] : 'Pendente'}</strong>
          </div>
        </li>

        <li
          data-pronto={briefingConfirmado || undefined}
          data-atual={etapaAtual === 'briefing' || undefined}
        >
          <span className={styles.numero}>
            {briefingConfirmado ? <Check size={13} aria-label="Concluído" /> : '02'}
          </span>
          <div className={styles.conteudo}>
            <p>Acordo do projeto</p>
            <strong>
              {briefingConfirmado ? 'Confirmado' : kickoff ? 'Pendente' : 'Bloqueado'}
            </strong>
          </div>
        </li>

        <li
          data-pronto={prazoDefinido || undefined}
          data-atual={etapaAtual === 'prazo' || undefined}
        >
          <span className={styles.numero}>
            {prazoDefinido ? <Check size={13} aria-label="Concluído" /> : '03'}
          </span>
          <div className={styles.conteudo}>
            <p>Prazo da entrega</p>
            <strong>{prazoDefinido ? 'Definido' : prazoLiberado ? 'Pendente' : 'Bloqueado'}</strong>
          </div>
        </li>

        <li
          className={styles.primeiroPasso}
          data-pronto={preparacaoCompleta || undefined}
          data-atual={etapaAtual === 'execucao' || undefined}
        >
          <span className={styles.numero}>04</span>
          <div className={styles.conteudo}>
            <p>Execução</p>
            <strong>{preparacaoCompleta ? 'Pronta' : 'Bloqueada'}</strong>
          </div>
        </li>
      </ol>

      <section className={styles.proximoPasso} aria-labelledby="proximo-passo-inicio">
        <span className={styles.proximoIcone} aria-hidden="true">
          {etapaAtual === 'kickoff' ? (
            <Video size={20} strokeWidth={1.8} />
          ) : etapaAtual === 'briefing' ? (
            <ClipboardCheck size={20} strokeWidth={1.8} />
          ) : etapaAtual === 'prazo' ? (
            <CalendarDays size={20} strokeWidth={1.8} />
          ) : (
            <ArrowRight size={20} strokeWidth={1.8} />
          )}
        </span>
        <div>
          <p>Próximo passo</p>
          <h3 id="proximo-passo-inicio">
            {etapaAtual === 'kickoff'
              ? kickoffPodeAbrir
                ? 'Entre no kickoff com o cliente'
                : kickoff?.status === 'cancelada'
                  ? 'Reagende o kickoff com o cliente'
                  : 'Agende o kickoff com o cliente'
              : etapaAtual === 'briefing'
                ? 'Confirme o acordo do projeto'
                : etapaAtual === 'prazo'
                  ? 'Defina o prazo da entrega'
                  : (primeiraTarefa ?? 'Abra a primeira tarefa')}
          </h3>
          <span>
            {etapaAtual === 'kickoff'
              ? kickoffPodeAbrir
                ? `${DATA_HORA.format(new Date(kickoff!.agendadaPara)).replace('.', '')} · alinhe objetivo, responsáveis e acessos.`
                : 'Alinhe objetivo, responsáveis e acessos.'
              : etapaAtual === 'briefing'
                ? 'Revise resultado, responsáveis, acessos e limites.'
                : etapaAtual === 'prazo'
                  ? 'Use a data combinada com o cliente.'
                  : 'O escopo aprovado já está organizado no passo a passo.'}
          </span>
        </div>

        {etapaAtual === 'kickoff' ? (
          <Link className={styles.acaoPrincipal} href={hrefKickoff}>
            {kickoffPodeAbrir
              ? 'Abrir kickoff'
              : kickoff?.status === 'cancelada'
                ? 'Reagendar kickoff'
                : 'Agendar kickoff'}{' '}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : etapaAtual === 'briefing' ? (
          <a className={styles.acaoPrincipal} href="#briefing-kickoff">
            Completar acordo <ArrowRight size={15} aria-hidden="true" />
          </a>
        ) : etapaAtual === 'prazo' ? (
          <form action={definirPrazo} className={styles.formPrazo}>
            <input type="hidden" name="projeto" value={projeto.id} />
            <input
              type="date"
              name="prazo"
              defaultValue={dataParaCampo(projeto.prazoEm)}
              aria-label="Prazo da entrega"
              required
            />
            <button type="submit" disabled={salvandoPrazo}>
              <Save size={14} aria-hidden="true" /> {salvandoPrazo ? 'Salvando…' : 'Salvar prazo'}
            </button>
          </form>
        ) : (
          <button type="button" className={styles.acaoPrincipal} onClick={onComecar}>
            Abrir primeira tarefa <ArrowRight size={15} aria-hidden="true" />
          </button>
        )}

        {estadoPrazo.erro && (
          <small className={styles.retorno} role="alert">
            {estadoPrazo.erro}
          </small>
        )}
        {estadoPrazo.sucesso && (
          <small className={styles.retorno} role="status">
            {estadoPrazo.sucesso}
          </small>
        )}
      </section>

      <div className={styles.aviso}>
        <KeyRound size={16} strokeWidth={1.8} aria-hidden="true" />
        <p>
          O acordo registra quem autoriza cada acesso e quais permissões serão liberadas. Senhas,
          tokens e chaves continuam sempre fora do projeto.
        </p>
      </div>
    </section>
  );
}

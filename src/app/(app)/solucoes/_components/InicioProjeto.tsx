'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  ArrowRight,
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
  const etapasProntas = [kickoffPronto, briefingConfirmado, prazoDefinido].filter(Boolean).length;
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
          <p>Preparação</p>
          <h2 id="inicio-projeto-titulo">Prepare o projeto</h2>
        </div>
        <span>{etapasProntas} de 3 concluídos</span>
      </header>

      <div className={styles.vendaConfirmada}>
        <div className={styles.vendaTexto}>
          <p>Proposta aprovada</p>
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

      <div className={styles.preparacao}>
        <ol className={styles.passos} aria-label="Preparação do projeto">
          <li
            data-pronto={kickoffPronto || undefined}
            data-atual={etapaAtual === 'kickoff' || undefined}
          >
            <span className={styles.numero}>
              {kickoffPronto ? <Check size={14} aria-label="Concluído" /> : '01'}
            </span>
            <div className={styles.conteudo}>
              <p>Kickoff</p>
              <strong>{kickoff ? ROTULO_STATUS_CALL[kickoff.status] : 'Agendar'}</strong>
            </div>
          </li>

          <li
            data-pronto={briefingConfirmado || undefined}
            data-atual={etapaAtual === 'briefing' || undefined}
          >
            <span className={styles.numero}>
              {briefingConfirmado ? <Check size={14} aria-label="Concluído" /> : '02'}
            </span>
            <div className={styles.conteudo}>
              <p>Acordo</p>
              <strong>{briefingConfirmado ? 'Confirmado' : 'Confirmar'}</strong>
            </div>
          </li>

          <li
            data-pronto={prazoDefinido || undefined}
            data-atual={etapaAtual === 'prazo' || undefined}
          >
            <span className={styles.numero}>
              {prazoDefinido ? <Check size={14} aria-label="Concluído" /> : '03'}
            </span>
            <div className={styles.conteudo}>
              <p>Prazo</p>
              <strong>
                {prazoDefinido ? 'Definido' : prazoLiberado ? 'Definir' : 'Depois do acordo'}
              </strong>
            </div>
          </li>
        </ol>

        <section className={styles.proximoPasso} aria-labelledby="proximo-passo-inicio">
          <span className={styles.proximoIcone} aria-hidden="true">
            {etapaAtual === 'kickoff' ? (
              <Video size={21} strokeWidth={1.8} />
            ) : etapaAtual === 'briefing' ? (
              <ClipboardCheck size={21} strokeWidth={1.8} />
            ) : etapaAtual === 'prazo' ? (
              <CalendarDays size={21} strokeWidth={1.8} />
            ) : (
              <ArrowRight size={21} strokeWidth={1.8} />
            )}
          </span>
          <div className={styles.proximoTexto}>
            <p>Agora</p>
            <h3 id="proximo-passo-inicio">
              {etapaAtual === 'kickoff'
                ? kickoffPodeAbrir
                  ? 'Entre no kickoff'
                  : kickoff?.status === 'cancelada'
                    ? 'Reagende o kickoff'
                    : 'Agende o kickoff'
                : etapaAtual === 'briefing'
                  ? 'Confirme o acordo'
                  : etapaAtual === 'prazo'
                    ? 'Defina o prazo'
                    : (primeiraTarefa ?? 'Abra a primeira tarefa')}
            </h3>
            <span>
              {etapaAtual === 'kickoff'
                ? kickoffPodeAbrir
                  ? `${DATA_HORA.format(new Date(kickoff!.agendadaPara)).replace('.', '')} · alinhe objetivo, responsáveis e acessos.`
                  : 'Alinhe objetivo, responsáveis e acessos com o cliente.'
                : etapaAtual === 'briefing'
                  ? 'Revise o resultado, os responsáveis e os limites.'
                  : etapaAtual === 'prazo'
                    ? 'Use a data combinada com o cliente.'
                    : 'O escopo aprovado já está organizado.'}
            </span>
          </div>

          <div className={styles.proximoAcao}>
            {etapaAtual === 'kickoff' ? (
              <Link className={styles.acaoPrincipal} href={hrefKickoff}>
                {kickoffPodeAbrir
                  ? 'Abrir kickoff'
                  : kickoff?.status === 'cancelada'
                    ? 'Reagendar kickoff'
                    : 'Agendar kickoff'}
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
                  <Save size={14} aria-hidden="true" />
                  {salvandoPrazo ? 'Salvando…' : 'Salvar prazo'}
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
          </div>
        </section>
      </div>

      <div className={styles.aviso}>
        <KeyRound size={16} strokeWidth={1.8} aria-hidden="true" />
        <p>Registre responsáveis e permissões. Nunca salve senhas, tokens ou chaves.</p>
      </div>
    </section>
  );
}

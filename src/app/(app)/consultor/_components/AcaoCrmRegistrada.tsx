'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  History,
  LoaderCircle,
  PencilLine,
  X,
} from 'lucide-react';
import { gerenciarAcaoCrm, type EstadoGerenciarAcaoCrm } from '@/lib/consultor/actions';
import type { AcaoConfirmadaCrm, ContextoAcaoCrm } from '@/lib/consultor/direcao';
import type { EventoAcaoCrm } from '@/lib/consultor/recomendacao';
import styles from './ConfirmarAcaoCrm.module.css';
import { RecomendacaoProximaAcao } from './RecomendacaoProximaAcao';

const GESTAO_INICIAL: EstadoGerenciarAcaoCrm = {};
type ModoGestao = 'concluir' | 'remarcar' | 'substituir' | null;

function dataNoCampo(iso: string | null): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(data);
  const valor = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}

function dataLegivel(isoOuData: string | null): string | null {
  if (!isoOuData) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(isoOuData) ? `${isoOuData}T12:00:00-03:00` : isoOuData;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(data);
}

function instanteLegivel(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(data);
}

function descreverEvento(evento: EventoAcaoCrm): { titulo: string; detalhe: string } {
  const dataAnterior = dataLegivel(evento.quando_anterior);
  const dataNova = dataLegivel(evento.quando_novo);

  if (evento.tipo === 'confirmada') {
    return {
      titulo: 'Ação confirmada',
      detalhe: dataNova ? `Combinada para ${dataNova}.` : 'Registrada sem data definida.',
    };
  }
  if (evento.tipo === 'remarcada') {
    return {
      titulo: 'Data remarcada',
      detalhe: `${dataAnterior ?? 'Sem data'} → ${dataNova ?? 'Sem data'}`,
    };
  }
  if (evento.tipo === 'substituida') {
    return { titulo: 'Próxima ação substituída', detalhe: evento.acao_nova };
  }
  if (evento.tipo === 'reativada') {
    return { titulo: 'Novo ciclo confirmado', detalhe: evento.acao_nova };
  }
  return { titulo: 'Ação concluída', detalhe: evento.acao_nova };
}

function HistoricoAcao({ eventos }: { eventos: EventoAcaoCrm[] }) {
  if (eventos.length === 0) return null;

  return (
    <details className={styles.historico}>
      <summary>
        <span>
          <History size={14} strokeWidth={1.9} aria-hidden="true" />
          Histórico
        </span>
        <span className={styles.totalEventos}>{eventos.length}</span>
        <ChevronDown className={styles.chevron} size={15} aria-hidden="true" />
      </summary>
      <ol>
        {[...eventos].reverse().map((evento, indice) => {
          const descricao = descreverEvento(evento);
          return (
            <li key={`${evento.criado_em}-${evento.tipo}-${indice}`}>
              <span className={styles.pontoHistorico} aria-hidden="true" />
              <span>
                <strong>{descricao.titulo}</strong>
                <em>{descricao.detalhe}</em>
              </span>
              <time dateTime={evento.criado_em}>{instanteLegivel(evento.criado_em)}</time>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

export function AcaoCrmRegistrada({
  mensagemId,
  contexto,
  confirmada,
  modoPreview,
  gerarProximoPasso,
}: {
  mensagemId: string;
  contexto: ContextoAcaoCrm;
  confirmada: AcaoConfirmadaCrm;
  modoPreview: boolean;
  gerarProximoPasso: boolean;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<ModoGestao>(null);
  const [reciboPreview, setReciboPreview] = useState(confirmada);
  const [estado, executar, pendente] = useActionState(gerenciarAcaoCrm, GESTAO_INICIAL);
  const recibo = modoPreview ? reciboPreview : confirmada;
  const modoAtivo = estado.status === 'sucesso' ? null : modo;
  const quando = dataLegivel(recibo.quando);
  const concluida = recibo.status === 'concluida';
  const hoje = dataNoCampo(new Date().toISOString());
  const prazoAtual = dataNoCampo(recibo.quando);
  const prazoInicial = prazoAtual >= hoje ? prazoAtual : '';

  useEffect(() => {
    if (estado.status === 'sucesso' && !modoPreview) router.refresh();
  }, [estado.status, modoPreview, router]);

  function simularMovimento(evento: React.FormEvent<HTMLFormElement>) {
    if (!modoPreview) return;
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const operacao = dados.get('operacao');
    if (operacao !== 'concluir' && operacao !== 'remarcar' && operacao !== 'substituir') return;

    const agora = new Date().toISOString();
    const acaoInformada = dados.get('acao');
    const quandoInformado = dados.get('quando');
    const acaoNova =
      operacao === 'substituir' && typeof acaoInformada === 'string' && acaoInformada.trim()
        ? acaoInformada.trim()
        : recibo.acao;
    const quandoNovo =
      operacao === 'concluir'
        ? recibo.quando
        : typeof quandoInformado === 'string' && quandoInformado
          ? quandoInformado
          : null;
    const tipo =
      operacao === 'concluir' ? 'concluida' : operacao === 'remarcar' ? 'remarcada' : 'substituida';

    setReciboPreview({
      ...recibo,
      acao: acaoNova,
      quando: quandoNovo,
      status: operacao === 'concluir' ? 'concluida' : 'pendente',
      concluida_em: operacao === 'concluir' ? agora : null,
      atualizado_em: agora,
      historico: [
        ...recibo.historico,
        {
          tipo,
          acao_anterior: recibo.acao,
          acao_nova: acaoNova,
          quando_anterior: recibo.quando,
          quando_novo: quandoNovo,
          criado_em: agora,
        },
      ],
    });
    setModo(null);
  }

  function simularConfirmacaoDaRecomendacao(acao: string, quando: string | null) {
    const agora = new Date().toISOString();
    setReciboPreview({
      ...recibo,
      acao,
      quando,
      status: 'pendente',
      concluida_em: null,
      atualizado_em: agora,
      recomendacao: recibo.recomendacao
        ? { ...recibo.recomendacao, acao, quando, status: 'confirmada', confirmada_em: agora }
        : null,
      historico: [
        ...recibo.historico,
        {
          tipo: 'reativada',
          acao_anterior: recibo.acao,
          acao_nova: acao,
          quando_anterior: recibo.quando,
          quando_novo: quando,
          criado_em: agora,
        },
      ],
    });
  }

  return (
    <section
      className={`${styles.registro} ${concluida ? styles.registroConcluido : ''}`}
      aria-label={concluida ? 'Ação concluída' : 'Ação ativa no CRM'}
    >
      <header className={styles.resumoRegistro}>
        <span className={styles.iconeConfirmado} aria-hidden="true">
          {concluida ? <CheckCircle2 size={16} /> : <Check size={15} strokeWidth={2.5} />}
        </span>
        <span className={styles.comprovanteCorpo}>
          <small>{concluida ? 'Concluída' : 'Ativa no CRM'}</small>
          <strong>{recibo.acao}</strong>
          <em>
            {contexto.empresa}
            {concluida
              ? ` · concluída ${dataLegivel(recibo.concluida_em) ?? ''}`
              : quando
                ? ` · ${quando}`
                : ' · sem data definida'}
          </em>
        </span>
        <Link
          href={`/crm/${contexto.oportunidade_id}`}
          className={styles.abrirLead}
          aria-label={`Ver oportunidade de ${contexto.empresa}`}
        >
          <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </header>

      {concluida ? (
        <RecomendacaoProximaAcao
          mensagemId={mensagemId}
          recomendacao={recibo.recomendacao?.status === 'pendente' ? recibo.recomendacao : null}
          gerarAutomaticamente={gerarProximoPasso}
          modoPreview={modoPreview}
          aoConfirmarPreview={simularConfirmacaoDaRecomendacao}
        />
      ) : null}

      {!concluida && !modoAtivo ? (
        <nav className={styles.acoesRegistro} aria-label="Atualizar esta ação">
          <button type="button" className={styles.concluir} onClick={() => setModo('concluir')}>
            <CheckCircle2 size={14} aria-hidden="true" /> Concluir
          </button>
          <button type="button" onClick={() => setModo('remarcar')}>
            <CalendarClock size={14} aria-hidden="true" /> Remarcar
          </button>
          <button type="button" onClick={() => setModo('substituir')}>
            <PencilLine size={14} aria-hidden="true" /> Trocar ação
          </button>
        </nav>
      ) : null}

      {!concluida && modoAtivo ? (
        <form action={executar} className={styles.painelGestao} onSubmit={simularMovimento}>
          <input type="hidden" name="mensagem" value={mensagemId} />
          <input type="hidden" name="operacao" value={modoAtivo} />
          <header>
            <span>
              <small>
                {modoAtivo === 'concluir'
                  ? 'Encerrar compromisso'
                  : modoAtivo === 'remarcar'
                    ? 'Nova data'
                    : 'Novo próximo passo'}
              </small>
              <strong>
                {modoAtivo === 'concluir'
                  ? 'Marcar esta ação como concluída?'
                  : modoAtivo === 'remarcar'
                    ? 'Para quando você quer remarcar?'
                    : 'O que passa a ser prioridade neste lead?'}
              </strong>
            </span>
            <button
              type="button"
              className={styles.fechar}
              onClick={() => setModo(null)}
              aria-label="Cancelar atualização da ação"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </header>

          {modoAtivo === 'concluir' ? (
            <p className={styles.explicacaoConclusao}>
              O compromisso sai das pendências. Depois, você poderá registrar a próxima ação do
              lead.
            </p>
          ) : null}
          {modoAtivo === 'substituir' ? (
            <label className={styles.campoAcao}>
              <span>Nova ação</span>
              <textarea
                name="acao"
                rows={3}
                minLength={3}
                maxLength={500}
                defaultValue={recibo.acao}
                required
              />
            </label>
          ) : null}
          {modoAtivo !== 'concluir' ? (
            <label className={styles.campoData}>
              <span>{modoAtivo === 'remarcar' ? 'Nova data combinada' : 'Data combinada'}</span>
              <input
                type="date"
                name="quando"
                min={hoje}
                defaultValue={prazoInicial}
                required={modoAtivo === 'remarcar'}
              />
            </label>
          ) : null}

          <div className={styles.acoesPainel}>
            <button type="button" className={styles.cancelar} onClick={() => setModo(null)}>
              Voltar
            </button>
            <button type="submit" className={styles.confirmar} disabled={pendente}>
              {pendente ? (
                <LoaderCircle className={styles.spinner} size={15} />
              ) : modoAtivo === 'concluir' ? (
                <CheckCircle2 size={15} />
              ) : (
                <Check size={15} />
              )}
              {pendente
                ? 'Atualizando'
                : modoAtivo === 'concluir'
                  ? 'Confirmar conclusão'
                  : modoAtivo === 'remarcar'
                    ? 'Salvar nova data'
                    : 'Trocar próxima ação'}
            </button>
          </div>
          {estado.status === 'erro' ? (
            <p className={styles.erro} role="alert">
              {estado.mensagem}
            </p>
          ) : (
            <p className={styles.seguranca}>A alteração ficará registrada no histórico.</p>
          )}
        </form>
      ) : null}

      <HistoricoAcao eventos={recibo.historico} />
    </section>
  );
}

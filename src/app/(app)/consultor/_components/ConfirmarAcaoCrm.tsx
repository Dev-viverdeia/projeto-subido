'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { ArrowRight, Check, ClipboardCheck, LoaderCircle, PencilLine, X } from 'lucide-react';
import { confirmarAcaoCrm, type EstadoConfirmarAcaoCrm } from '@/lib/consultor/actions';
import type { AcaoConfirmadaCrm, ContextoAcaoCrm } from '@/lib/consultor/direcao';
import styles from './ConfirmarAcaoCrm.module.css';

const INICIAL: EstadoConfirmarAcaoCrm = {};

function dataNoCampo(iso: string | null): string {
  if (!iso) return '';
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

function dataMinima(): string {
  return dataNoCampo(new Date().toISOString());
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

function Comprovante({
  contexto,
  confirmada,
}: {
  contexto: ContextoAcaoCrm;
  confirmada: AcaoConfirmadaCrm;
}) {
  const quando = dataLegivel(confirmada.quando);

  return (
    <aside className={styles.comprovante} aria-label="Ação registrada no CRM">
      <span className={styles.iconeConfirmado} aria-hidden="true">
        <Check size={15} strokeWidth={2.5} />
      </span>
      <span className={styles.comprovanteCorpo}>
        <small>Registrada no CRM</small>
        <strong>{confirmada.acao}</strong>
        <em>
          {contexto.empresa}
          {quando ? ` · ${quando}` : ' · sem data definida'}
        </em>
      </span>
      <Link
        href={`/crm/${contexto.oportunidade_id}`}
        className={styles.abrirLead}
        aria-label={`Ver oportunidade de ${contexto.empresa}`}
      >
        <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </aside>
  );
}

export function ConfirmarAcaoCrm({
  mensagemId,
  contexto,
  confirmada = null,
  modoPreview = false,
}: {
  mensagemId: string;
  contexto: ContextoAcaoCrm;
  confirmada?: AcaoConfirmadaCrm | null;
  modoPreview?: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [confirmacaoPreview, setConfirmacaoPreview] = useState<AcaoConfirmadaCrm | null>(null);
  const [estado, acao, pendente] = useActionState(confirmarAcaoCrm, INICIAL);
  const registrada = confirmada ?? confirmacaoPreview;
  const hoje = dataMinima();
  const prazoAnterior = dataNoCampo(contexto.prazo_atual);
  const prazoInicial = prazoAnterior >= hoje ? prazoAnterior : '';

  useEffect(() => {
    if (estado.status === 'sucesso' && !modoPreview) router.refresh();
  }, [estado.status, modoPreview, router]);

  if (registrada || estado.status === 'sucesso') {
    return (
      <Comprovante
        contexto={contexto}
        confirmada={
          registrada ?? {
            acao: estado.acao ?? contexto.acao_sugerida,
            quando: estado.quando ?? null,
            confirmada_em: new Date().toISOString(),
          }
        }
      />
    );
  }

  if (!aberto) {
    return (
      <aside className={styles.convite} aria-label="Ação pronta para revisar">
        <span className={styles.iconeConvite} aria-hidden="true">
          <ClipboardCheck size={17} strokeWidth={1.9} />
        </span>
        <span className={styles.conviteCorpo}>
          <small>Ação pronta para o CRM</small>
          <strong>{contexto.acao_sugerida}</strong>
          <em>{contexto.empresa}</em>
        </span>
        <button type="button" className={styles.revisar} onClick={() => setAberto(true)}>
          Revisar
          <PencilLine size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </aside>
    );
  }

  return (
    <form
      action={acao}
      className={styles.formulario}
      onSubmit={(evento) => {
        if (!modoPreview) return;
        evento.preventDefault();
        const dados = new FormData(evento.currentTarget);
        const acaoDoFormulario = dados.get('acao');
        const quandoDoFormulario = dados.get('quando');
        setConfirmacaoPreview({
          acao: typeof acaoDoFormulario === 'string' ? acaoDoFormulario : contexto.acao_sugerida,
          quando:
            typeof quandoDoFormulario === 'string' && quandoDoFormulario
              ? quandoDoFormulario
              : null,
          confirmada_em: new Date().toISOString(),
        });
      }}
    >
      <input type="hidden" name="mensagem" value={mensagemId} />

      <header className={styles.formularioTopo}>
        <span>
          <ClipboardCheck size={16} strokeWidth={1.9} aria-hidden="true" />
          <span>
            <small>Confirmar no CRM</small>
            <strong>{contexto.empresa}</strong>
          </span>
        </span>
        <button
          type="button"
          className={styles.fechar}
          onClick={() => setAberto(false)}
          aria-label="Cancelar revisão da ação"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      <label className={styles.campoAcao}>
        <span>Próxima ação</span>
        <textarea
          name="acao"
          rows={3}
          minLength={3}
          maxLength={500}
          defaultValue={contexto.acao_sugerida}
          required
        />
      </label>

      <div className={styles.rodapeFormulario}>
        <label className={styles.campoData}>
          <span>Data combinada</span>
          <input type="date" name="quando" min={hoje} defaultValue={prazoInicial} />
        </label>
        <button type="submit" className={styles.confirmar} disabled={pendente}>
          {pendente ? (
            <LoaderCircle className={styles.spinner} size={15} aria-hidden="true" />
          ) : (
            <Check size={15} strokeWidth={2.4} aria-hidden="true" />
          )}
          {pendente ? 'Registrando' : 'Registrar no CRM'}
        </button>
      </div>

      {contexto.acao_atual && contexto.acao_atual !== contexto.acao_sugerida ? (
        <p className={styles.substituicao}>
          Substitui a ação atual: <span>{contexto.acao_atual}</span>
        </p>
      ) : null}

      {estado.status === 'erro' ? (
        <p className={styles.erro} role="alert">
          {estado.mensagem}
        </p>
      ) : (
        <p className={styles.seguranca}>Nada muda antes desta confirmação.</p>
      )}
    </form>
  );
}

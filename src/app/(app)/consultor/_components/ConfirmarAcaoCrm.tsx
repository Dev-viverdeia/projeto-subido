'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { Check, ClipboardCheck, LoaderCircle, PencilLine, X } from 'lucide-react';
import { confirmarAcaoCrm, type EstadoConfirmarAcaoCrm } from '@/lib/consultor/actions';
import type { AcaoConfirmadaCrm, ContextoAcaoCrm } from '@/lib/consultor/direcao';
import { AcaoCrmRegistrada } from './AcaoCrmRegistrada';
import styles from './ConfirmarAcaoCrm.module.css';

const INICIAL: EstadoConfirmarAcaoCrm = {};

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

export function ConfirmarAcaoCrm({
  mensagemId,
  contexto,
  confirmada = null,
  modoPreview = false,
  gerarProximoPasso = false,
}: {
  mensagemId: string;
  contexto: ContextoAcaoCrm;
  confirmada?: AcaoConfirmadaCrm | null;
  modoPreview?: boolean;
  gerarProximoPasso?: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [confirmacaoPreview, setConfirmacaoPreview] = useState<AcaoConfirmadaCrm | null>(null);
  const [estado, acao, pendente] = useActionState(confirmarAcaoCrm, INICIAL);
  const registrada = confirmada ?? confirmacaoPreview;
  const hoje = dataNoCampo(new Date().toISOString());
  const prazoAnterior = dataNoCampo(contexto.prazo_atual);
  const prazoInicial = prazoAnterior >= hoje ? prazoAnterior : '';

  useEffect(() => {
    if (estado.status === 'sucesso' && !modoPreview) router.refresh();
  }, [estado.status, modoPreview, router]);

  if (registrada || estado.status === 'sucesso') {
    const agora = new Date().toISOString();
    const acaoRegistrada = estado.acao ?? contexto.acao_sugerida;
    const quandoRegistrado = estado.quando ?? null;
    const recibo =
      registrada ??
      ({
        acao: acaoRegistrada,
        quando: quandoRegistrado,
        confirmada_em: agora,
        atualizado_em: agora,
        status: 'pendente',
        concluida_em: null,
        recomendacao: null,
        historico: [
          {
            tipo: 'confirmada',
            acao_anterior: null,
            acao_nova: acaoRegistrada,
            quando_anterior: null,
            quando_novo: quandoRegistrado,
            criado_em: agora,
          },
        ],
      } satisfies AcaoConfirmadaCrm);

    return (
      <AcaoCrmRegistrada
        key={recibo.atualizado_em}
        mensagemId={mensagemId}
        contexto={contexto}
        confirmada={recibo}
        modoPreview={modoPreview}
        gerarProximoPasso={gerarProximoPasso}
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
          Revisar <PencilLine size={14} strokeWidth={2} aria-hidden="true" />
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
        const agora = new Date().toISOString();
        const acaoConfirmada =
          typeof acaoDoFormulario === 'string' ? acaoDoFormulario : contexto.acao_sugerida;
        const quandoConfirmado =
          typeof quandoDoFormulario === 'string' && quandoDoFormulario ? quandoDoFormulario : null;
        setConfirmacaoPreview({
          acao: acaoConfirmada,
          quando: quandoConfirmado,
          confirmada_em: agora,
          atualizado_em: agora,
          status: 'pendente',
          concluida_em: null,
          recomendacao: null,
          historico: [
            {
              tipo: 'confirmada',
              acao_anterior: null,
              acao_nova: acaoConfirmada,
              quando_anterior: null,
              quando_novo: quandoConfirmado,
              criado_em: agora,
            },
          ],
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
          {pendente ? <LoaderCircle className={styles.spinner} size={15} /> : <Check size={15} />}
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

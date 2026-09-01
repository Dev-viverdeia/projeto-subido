'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { CalendarDays, Check, PencilLine } from 'lucide-react';
import { Alert, Button } from '@/design-system/via';
import { definirProximaAcao, type EstadoProximaAcao } from '@/lib/crm/actions';
import { ModalOperacao } from '../../../_components/ModalOperacao';
import styles from './EditarProximaAcao.module.css';

const INICIAL: EstadoProximaAcao = {};

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

export function EditarProximaAcao({
  oportunidadeId,
  acaoAtual,
  quandoAtual,
}: {
  oportunidadeId: string;
  acaoAtual: string | null;
  quandoAtual: string | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [salva, setSalva] = useState(false);
  const [estado, acao, pendente] = useActionState(definirProximaAcao, INICIAL);
  const hoje = dataNoCampo(new Date().toISOString());
  const prazoAtual = dataNoCampo(quandoAtual);
  const prazoInicial = prazoAtual >= hoje ? prazoAtual : '';

  useEffect(() => {
    if (estado.status !== 'sucesso') return;
    const quadro = window.requestAnimationFrame(() => {
      setAberto(false);
      setSalva(true);
      router.refresh();
    });
    const tempo = window.setTimeout(() => setSalva(false), 3400);
    return () => {
      window.cancelAnimationFrame(quadro);
      window.clearTimeout(tempo);
    };
  }, [estado.status, router]);

  return (
    <>
      <button
        type="button"
        className={styles.gatilho}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
      >
        {salva ? (
          <Check size={15} strokeWidth={2} aria-hidden="true" />
        ) : (
          <PencilLine size={15} strokeWidth={1.9} aria-hidden="true" />
        )}
        {salva ? 'Ação salva' : acaoAtual ? 'Editar próxima ação' : 'Definir próxima ação'}
      </button>

      <ModalOperacao
        open={aberto}
        onClose={() => !pendente && setAberto(false)}
        title={acaoAtual ? 'Editar próxima ação' : 'Definir próxima ação'}
        description="Registre o próximo movimento concreto desta venda."
        size="md"
        blocked={pendente}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAberto(false)}
              disabled={pendente}
            >
              Cancelar
            </Button>
            <Button type="submit" form="form-proxima-acao" loading={pendente} disabled={pendente}>
              {pendente ? 'Salvando…' : 'Salvar próxima ação'}
            </Button>
          </>
        }
      >
        <form id="form-proxima-acao" action={acao} className={styles.formulario}>
          <input type="hidden" name="oportunidade" value={oportunidadeId} />

          <label className={styles.campoAcao}>
            <span>O que precisa acontecer agora?</span>
            <textarea
              name="acao"
              rows={4}
              minLength={3}
              maxLength={500}
              defaultValue={acaoAtual ?? ''}
              placeholder="Ex.: Enviar o escopo revisado e combinar a data da decisão."
              aria-invalid={Boolean(estado.porCampo?.acao)}
              aria-describedby={estado.porCampo?.acao ? 'erro-proxima-acao' : undefined}
              autoFocus
              required
            />
            {estado.porCampo?.acao && (
              <small id="erro-proxima-acao" role="alert">
                {estado.porCampo.acao}
              </small>
            )}
          </label>

          <label className={styles.campoData}>
            <span>
              <CalendarDays size={15} strokeWidth={1.8} aria-hidden="true" />
              Quando você pretende fazer isso?
            </span>
            <input
              type="date"
              name="quando"
              min={hoje}
              defaultValue={prazoInicial}
              aria-invalid={Boolean(estado.porCampo?.quando)}
            />
            <small>
              A data é opcional. Se houver um combinado, ela aparece como prazo no Kanban.
            </small>
          </label>

          {estado.status === 'erro' && !estado.porCampo && (
            <Alert tone="danger" size="compact">
              {estado.mensagem}
            </Alert>
          )}
        </form>
      </ModalOperacao>
    </>
  );
}

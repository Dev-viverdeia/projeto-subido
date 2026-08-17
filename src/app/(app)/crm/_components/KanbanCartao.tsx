'use client';

import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  FileText,
  GripVertical,
  Inbox,
  Layers3,
  MessageSquareMore,
  XCircle,
} from 'lucide-react';
import { DropdownMenu } from '@/design-system/via';
import { ROTULO_ETAPA, etapaVisivel, rotuloMotivoPerda, type EtapaCrm } from '@/lib/crm/etapas';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import styles from './PipelineCrm.module.css';

const FORMATADOR_DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
});

const ICONES_ETAPA = {
  novo_lead: Inbox,
  descoberta: MessageSquareMore,
  proposta: FileText,
} as const;

export type SolicitarMovimento = (oportunidade: OportunidadeCrm, etapa: EtapaCrm) => void;

function dataCurta(iso: string): string {
  return FORMATADOR_DATA.format(new Date(iso)).replace('.', '');
}

function MenuMovimentacao({
  oportunidade,
  aoMover,
  desabilitado,
}: {
  oportunidade: OportunidadeCrm;
  aoMover: SolicitarMovimento;
  desabilitado: boolean;
}) {
  const etapaAtual = etapaVisivel(oportunidade.etapa);
  const itensAtivos = (['novo_lead', 'descoberta', 'proposta'] as const).map((etapa) => {
    const Icone = ICONES_ETAPA[etapa];
    return {
      id: etapa,
      label: ROTULO_ETAPA[etapa],
      icon: <Icone size={14} strokeWidth={1.9} />,
      disabled: etapaAtual === etapa || desabilitado,
      onSelect: () => aoMover(oportunidade, etapa),
    };
  });

  return (
    <DropdownMenu
      align="end"
      ariaLabel={`Mover ${oportunidade.titulo}`}
      className={styles.menuMovimentacao}
      trigger={
        <button
          type="button"
          className={styles.botaoMover}
          disabled={desabilitado}
          aria-label={`Escolher nova etapa de ${oportunidade.titulo}`}
        >
          <span>Mover</span>
          <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      }
      groups={[
        { id: 'pipeline', label: 'Etapa de trabalho', items: itensAtivos },
        {
          id: 'desfecho',
          label: 'Encerrar oportunidade',
          items: [
            {
              id: 'ganho',
              label: 'Marcar como ganha',
              icon: <CheckCircle2 size={14} strokeWidth={1.9} />,
              disabled: etapaAtual === 'ganho' || desabilitado,
              onSelect: () => aoMover(oportunidade, 'ganho'),
            },
            {
              id: 'perdido',
              label: 'Marcar como perdida',
              icon: <XCircle size={14} strokeWidth={1.9} />,
              disabled: etapaAtual === 'perdido' || desabilitado,
              // O menu fecha antes do modal entrar. Isso evita que o scrim do
              // diálogo intercepte o mesmo clique que acabou de escolher a ação.
              onSelect: () => setTimeout(() => aoMover(oportunidade, 'perdido'), 0),
            },
          ],
        },
      ]}
    />
  );
}

function ConteudoCartao({ oportunidade }: { oportunidade: OportunidadeCrm }) {
  const analisando =
    oportunidade.enriquecimentoStatus === 'na_fila' ||
    oportunidade.enriquecimentoStatus === 'processando';
  const pronto = oportunidade.enriquecimentoStatus === 'concluido';

  return (
    <>
      <div className={styles.empresa}>
        <Building2 size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>{oportunidade.empresa}</span>
      </div>
      <h3>{oportunidade.titulo}</h3>

      {oportunidade.contato && (
        <p className={styles.contato}>
          <CircleUserRound size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>{oportunidade.contato}</span>
        </p>
      )}

      {oportunidade.etapa === 'perdido' && (
        <div className={styles.motivoPerda}>
          <span>Motivo da perda</span>
          <strong>{rotuloMotivoPerda(oportunidade.motivoPerda)}</strong>
        </div>
      )}

      <div className={styles.fato}>
        <Clock3 size={13} strokeWidth={1.8} aria-hidden="true" />
        <span>{oportunidade.ultimoFato ?? 'Sem interação registrada'}</span>
        <time dateTime={oportunidade.ultimoFatoEm ?? oportunidade.criadoEm}>
          {dataCurta(oportunidade.ultimoFatoEm ?? oportunidade.criadoEm)}
        </time>
      </div>

      <Link
        href={`/crm/${oportunidade.id}`}
        className={styles.dossie}
        data-estado={analisando ? 'analisando' : pronto ? 'pronto' : 'novo'}
      >
        <Layers3 size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>{analisando ? 'Analisando lead' : pronto ? 'Dossiê pronto' : 'Abrir dossiê'}</span>
      </Link>
    </>
  );
}

export function CartaoOportunidade({
  oportunidade,
  aoMover,
  desabilitado,
}: {
  oportunidade: OportunidadeCrm;
  aoMover: SolicitarMovimento;
  desabilitado: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card:${oportunidade.id}`,
    data: { oportunidade },
    disabled: desabilitado,
  });
  const estilo = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const fechada = oportunidade.etapa === 'ganho' || oportunidade.etapa === 'perdido';

  return (
    <article
      ref={setNodeRef}
      style={estilo}
      className={styles.cartao}
      data-arrastando={isDragging || undefined}
      data-fechada={fechada || undefined}
      aria-busy={desabilitado || undefined}
    >
      <div className={styles.cartaoTopo}>
        {fechada ? (
          <span className={styles.etapaAtual} data-etapa={oportunidade.etapa}>
            {oportunidade.etapa === 'ganho' ? (
              <CheckCircle2 size={13} strokeWidth={2} aria-hidden="true" />
            ) : (
              <XCircle size={13} strokeWidth={2} aria-hidden="true" />
            )}
            {oportunidade.etapa === 'ganho' ? 'Ganha' : 'Perdida'}
          </span>
        ) : (
          <span className={styles.etapaAtual}>Em andamento</span>
        )}

        <button
          type="button"
          className={styles.alca}
          disabled={desabilitado}
          aria-label={`Arrastar ${oportunidade.titulo}`}
          title="Arrastar oportunidade"
          {...listeners}
          {...attributes}
        >
          <GripVertical size={17} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <ConteudoCartao oportunidade={oportunidade} />

      <div className={styles.rodapeCartao}>
        <span>{fechada ? 'Reabra ou mova pelo menu' : 'Arraste para avançar'}</span>
        <MenuMovimentacao
          oportunidade={oportunidade}
          aoMover={aoMover}
          desabilitado={desabilitado}
        />
      </div>
    </article>
  );
}

export function CartaoOverlay({ oportunidade }: { oportunidade: OportunidadeCrm }) {
  return (
    <div className={styles.overlay}>
      <span>{oportunidade.empresa}</span>
      <strong>{oportunidade.titulo}</strong>
      <small>Solte na nova etapa</small>
    </div>
  );
}

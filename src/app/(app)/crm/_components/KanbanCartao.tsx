'use client';

import { useCallback, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GripVertical,
  Inbox,
  MessageSquareMore,
  MoreHorizontal,
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

const FORMATADOR_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
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

function valorDaOportunidade(valorCentavos: number | null): string | null {
  return valorCentavos === null ? null : FORMATADOR_MOEDA.format(valorCentavos / 100);
}

function impedirArraste(evento: SyntheticEvent) {
  evento.stopPropagation();
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
    <div
      className={styles.menuMovimentacao}
      data-no-dnd
      onMouseDown={impedirArraste}
      onTouchStart={impedirArraste}
      onKeyDown={impedirArraste}
    >
      <DropdownMenu
        align="end"
        ariaLabel={`Ações de ${oportunidade.titulo}`}
        trigger={
          <button
            type="button"
            className={styles.botaoAcoes}
            disabled={desabilitado}
            aria-label={`Ações de ${oportunidade.titulo}`}
          >
            <MoreHorizontal size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>
        }
        groups={[
          { id: 'pipeline', label: 'Mover para', items: itensAtivos },
          {
            id: 'desfecho',
            label: 'Registrar desfecho',
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
                onSelect: () => aoMover(oportunidade, 'perdido'),
              },
            ],
          },
        ]}
      />
    </div>
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
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, isDragging } = useDraggable({
    id: `card:${oportunidade.id}`,
    data: { oportunidade },
    disabled: desabilitado,
  });
  const definirRef = useCallback(
    (elemento: HTMLElement | null) => {
      setNodeRef(elemento);
      setActivatorNodeRef(elemento);
    },
    [setActivatorNodeRef, setNodeRef],
  );
  const valor = valorDaOportunidade(oportunidade.valorCentavos);

  return (
    <article
      ref={definirRef}
      className={styles.cartao}
      data-arrastando={isDragging || undefined}
      {...attributes}
      {...listeners}
      aria-busy={desabilitado || undefined}
      aria-label={`${oportunidade.titulo}, ${oportunidade.empresa}. Arraste para mudar de etapa.`}
      role="group"
      tabIndex={desabilitado ? -1 : 0}
    >
      <div className={styles.cartaoCabecalho}>
        <div className={styles.empresa}>
          <span>{oportunidade.empresa}</span>
          {valor && <strong>{valor}</strong>}
        </div>
        <GripVertical
          className={styles.sinalArraste}
          size={17}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </div>

      <h3>{oportunidade.titulo}</h3>

      {oportunidade.contato && <p className={styles.contato}>{oportunidade.contato}</p>}

      <div className={styles.proximoPasso} data-vazio={!oportunidade.proximaAcao || undefined}>
        <span>{oportunidade.proximaAcao ? 'Próximo passo' : 'Último registro'}</span>
        <strong>{oportunidade.proximaAcao ?? oportunidade.ultimoFato ?? 'Sem atividade'}</strong>
      </div>

      <footer className={styles.rodapeCartao}>
        <time dateTime={oportunidade.ultimoFatoEm ?? oportunidade.criadoEm}>
          Atualizado {dataCurta(oportunidade.ultimoFatoEm ?? oportunidade.criadoEm)}
        </time>
        <div className={styles.acoesCartao}>
          <Link
            href={`/crm/${oportunidade.id}`}
            className={styles.dossie}
            data-no-dnd
            onMouseDown={impedirArraste}
            onTouchStart={impedirArraste}
            onKeyDown={impedirArraste}
          >
            Abrir
            <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
          </Link>
          <MenuMovimentacao
            oportunidade={oportunidade}
            aoMover={aoMover}
            desabilitado={desabilitado}
          />
        </div>
      </footer>
    </article>
  );
}

export function CartaoEncerrado({
  oportunidade,
  aoMover,
  desabilitado,
}: {
  oportunidade: OportunidadeCrm;
  aoMover: SolicitarMovimento;
  desabilitado: boolean;
}) {
  const perdida = oportunidade.etapa === 'perdido';
  const Icone = perdida ? XCircle : CheckCircle2;
  const encerradaEm = oportunidade.perdidaEm ?? oportunidade.ganhaEm ?? oportunidade.atualizadoEm;
  const valor = valorDaOportunidade(oportunidade.valorCentavos);

  return (
    <article className={styles.cartaoEncerrado} data-resultado={perdida ? 'perdido' : 'ganho'}>
      <header>
        <span className={styles.estadoEncerrado}>
          <Icone size={14} strokeWidth={2} aria-hidden="true" />
          {perdida ? 'Perdida' : 'Ganha'}
        </span>
        <MenuMovimentacao
          oportunidade={oportunidade}
          aoMover={aoMover}
          desabilitado={desabilitado}
        />
      </header>
      <div className={styles.encerradoTitulo}>
        <div>
          <span>{oportunidade.empresa}</span>
          <h3>{oportunidade.titulo}</h3>
        </div>
        {valor && <strong>{valor}</strong>}
      </div>
      {perdida && (
        <p className={styles.motivoPerda}>
          <span>Motivo</span>
          <strong>{rotuloMotivoPerda(oportunidade.motivoPerda)}</strong>
        </p>
      )}
      <footer>
        <time dateTime={encerradaEm}>{dataCurta(encerradaEm)}</time>
        <Link href={`/crm/${oportunidade.id}`}>
          Abrir dossiê
          <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}

export function CartaoOverlay({ oportunidade }: { oportunidade: OportunidadeCrm }) {
  return (
    <div className={styles.overlay}>
      <span>{oportunidade.empresa}</span>
      <strong>{oportunidade.titulo}</strong>
      <small>Solte na etapa desejada</small>
    </div>
  );
}

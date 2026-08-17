'use client';

import { useDroppable } from '@dnd-kit/core';
import { CheckCircle2, Inbox, XCircle } from 'lucide-react';
import type { FASES_CRM, EtapaCrm, IdFaseCrm } from '@/lib/crm/etapas';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import { CartaoOportunidade, type SolicitarMovimento } from './KanbanCartao';
import styles from './PipelineCrm.module.css';

const ETAPA_DA_FASE: Record<Exclude<IdFaseCrm, 'desfecho'>, EtapaCrm> = {
  entrada: 'novo_lead',
  conversa: 'descoberta',
  proposta: 'proposta',
};

function Vazio({ texto }: { texto: string }) {
  return (
    <div className={styles.vazio}>
      <Inbox size={18} strokeWidth={1.5} aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}

export function ColunaAtiva({
  fase,
  numero,
  oportunidades,
  aoMover,
  movimentandoId,
}: {
  fase: (typeof FASES_CRM)[number];
  numero: number;
  oportunidades: OportunidadeCrm[];
  aoMover: SolicitarMovimento;
  movimentandoId: string | null;
}) {
  const etapa = ETAPA_DA_FASE[fase.id as Exclude<IdFaseCrm, 'desfecho'>];
  const { isOver, setNodeRef } = useDroppable({
    id: `fase:${fase.id}`,
    data: { etapa },
  });

  return (
    <section
      ref={setNodeRef}
      className={styles.coluna}
      data-fase={fase.id}
      data-sobre={isOver || undefined}
      aria-labelledby={`coluna-${fase.id}`}
    >
      <header className={styles.colunaTopo}>
        <span className={styles.faseNumero} aria-hidden="true">
          {String(numero).padStart(2, '0')}
        </span>
        <div>
          <h2 id={`coluna-${fase.id}`}>{fase.rotulo}</h2>
          <p>{fase.descricao}</p>
        </div>
        <span className={styles.contador} aria-label={`${oportunidades.length} oportunidades`}>
          {oportunidades.length}
        </span>
      </header>

      <div className={styles.lista}>
        {oportunidades.length ? (
          oportunidades.map((oportunidade) => (
            <CartaoOportunidade
              key={oportunidade.id}
              oportunidade={oportunidade}
              aoMover={aoMover}
              desabilitado={movimentandoId !== null}
            />
          ))
        ) : (
          <Vazio texto="Solte uma oportunidade aqui" />
        )}
      </div>
    </section>
  );
}

function ZonaResultado({
  etapa,
  oportunidades,
  aoMover,
  movimentandoId,
}: {
  etapa: 'ganho' | 'perdido';
  oportunidades: OportunidadeCrm[];
  aoMover: SolicitarMovimento;
  movimentandoId: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `resultado:${etapa}`,
    data: { etapa },
  });
  const Icone = etapa === 'ganho' ? CheckCircle2 : XCircle;

  return (
    <div
      ref={setNodeRef}
      className={styles.zonaResultado}
      data-resultado={etapa}
      data-sobre={isOver || undefined}
    >
      <header>
        <span>
          <Icone size={15} strokeWidth={1.9} aria-hidden="true" />
          {etapa === 'ganho' ? 'Ganhas' : 'Perdidas'}
        </span>
        <strong aria-label={`${oportunidades.length} oportunidades`}>{oportunidades.length}</strong>
      </header>
      <div className={styles.listaResultado}>
        {oportunidades.length ? (
          oportunidades.map((oportunidade) => (
            <CartaoOportunidade
              key={oportunidade.id}
              oportunidade={oportunidade}
              aoMover={aoMover}
              desabilitado={movimentandoId !== null}
            />
          ))
        ) : (
          <Vazio
            texto={
              etapa === 'ganho' ? 'Solte uma venda concluída' : 'Solte para encerrar com motivo'
            }
          />
        )}
      </div>
    </div>
  );
}

export function ColunaDesfecho({
  ganhas,
  perdidas,
  aoMover,
  movimentandoId,
}: {
  ganhas: OportunidadeCrm[];
  perdidas: OportunidadeCrm[];
  aoMover: SolicitarMovimento;
  movimentandoId: string | null;
}) {
  return (
    <section
      className={`${styles.coluna} ${styles.colunaDesfecho}`}
      aria-labelledby="desfecho-titulo"
    >
      <header className={styles.colunaTopo}>
        <span className={styles.faseNumero} aria-hidden="true">
          04
        </span>
        <div>
          <h2 id="desfecho-titulo">Desfecho</h2>
          <p>Decisão registrada</p>
        </div>
        <span
          className={styles.contador}
          aria-label={`${ganhas.length + perdidas.length} oportunidades`}
        >
          {ganhas.length + perdidas.length}
        </span>
      </header>
      <div className={styles.desfechos}>
        <ZonaResultado
          etapa="ganho"
          oportunidades={ganhas}
          aoMover={aoMover}
          movimentandoId={movimentandoId}
        />
        <ZonaResultado
          etapa="perdido"
          oportunidades={perdidas}
          aoMover={aoMover}
          movimentandoId={movimentandoId}
        />
      </div>
    </section>
  );
}

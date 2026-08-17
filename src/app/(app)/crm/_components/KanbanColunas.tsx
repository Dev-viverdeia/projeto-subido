'use client';

import { useDroppable } from '@dnd-kit/core';
import { CheckCircle2, ChevronDown, XCircle } from 'lucide-react';
import type { FASES_CRM, EtapaCrm, IdFaseCrm } from '@/lib/crm/etapas';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import { CartaoEncerrado, CartaoOportunidade, type SolicitarMovimento } from './KanbanCartao';
import styles from './PipelineCrm.module.css';

const ETAPA_DA_FASE: Record<Exclude<IdFaseCrm, 'desfecho'>, EtapaCrm> = {
  entrada: 'novo_lead',
  conversa: 'descoberta',
  proposta: 'proposta',
};

function Vazio() {
  return (
    <div className={styles.vazio}>
      <span>Nenhuma oportunidade</span>
      <small>Solte um card nesta etapa</small>
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
        <div>
          <span className={styles.faseNumero}>Etapa {numero}</span>
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
          <Vazio />
        )}
      </div>
    </section>
  );
}

function DestinoDesfecho({ etapa, total }: { etapa: 'ganho' | 'perdido'; total: number }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `resultado:${etapa}`,
    data: { etapa },
  });
  const perdida = etapa === 'perdido';
  const Icone = perdida ? XCircle : CheckCircle2;

  return (
    <div
      ref={setNodeRef}
      className={styles.destinoDesfecho}
      data-resultado={etapa}
      data-sobre={isOver || undefined}
      role="group"
      aria-label={perdida ? 'Marcar oportunidade como perdida' : 'Marcar oportunidade como ganha'}
    >
      <Icone size={18} strokeWidth={1.8} aria-hidden="true" />
      <div>
        <strong>{perdida ? 'Perdida' : 'Ganha'}</strong>
        <span>{perdida ? 'Registra o motivo' : 'Inicia a entrega'}</span>
      </div>
      <small aria-label={`${total} oportunidades encerradas`}>{total}</small>
    </div>
  );
}

export function BandejaDesfecho({
  ganhas,
  perdidas,
  arrastando,
}: {
  ganhas: number;
  perdidas: number;
  arrastando: boolean;
}) {
  return (
    <section className={styles.bandejaDesfecho} data-arrastando={arrastando || undefined}>
      <div className={styles.bandejaTexto}>
        <span>Desfecho</span>
        <strong>{arrastando ? 'Onde esta oportunidade terminou?' : 'Concluir oportunidade'}</strong>
        <small>
          {arrastando ? 'Solte em uma das opções.' : 'Arraste um card até o resultado.'}
        </small>
      </div>
      <div className={styles.destinosDesfecho}>
        <DestinoDesfecho etapa="ganho" total={ganhas} />
        <DestinoDesfecho etapa="perdido" total={perdidas} />
      </div>
    </section>
  );
}

export function HistoricoDesfechos({
  oportunidades,
  aoMover,
  movimentandoId,
}: {
  oportunidades: OportunidadeCrm[];
  aoMover: SolicitarMovimento;
  movimentandoId: string | null;
}) {
  if (oportunidades.length === 0) return null;

  const ordenadas = [...oportunidades].sort((a, b) =>
    (b.perdidaEm ?? b.ganhaEm ?? b.atualizadoEm).localeCompare(
      a.perdidaEm ?? a.ganhaEm ?? a.atualizadoEm,
    ),
  );
  const ganhas = oportunidades.filter((item) => item.etapa === 'ganho').length;
  const perdidas = oportunidades.length - ganhas;

  return (
    <details className={styles.historico}>
      <summary>
        <div>
          <span>Histórico de desfechos</span>
          <small>
            {ganhas} {ganhas === 1 ? 'ganha' : 'ganhas'} · {perdidas}{' '}
            {perdidas === 1 ? 'perdida' : 'perdidas'}
          </small>
        </div>
        <span className={styles.abrirHistorico}>
          Ver oportunidades
          <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </summary>
      <div className={styles.listaHistorico}>
        {ordenadas.map((oportunidade) => (
          <CartaoEncerrado
            key={oportunidade.id}
            oportunidade={oportunidade}
            aoMover={aoMover}
            desabilitado={movimentandoId !== null}
          />
        ))}
      </div>
    </details>
  );
}

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

const TEXTO_VAZIO: Record<Exclude<IdFaseCrm, 'desfecho'>, { titulo: string; apoio: string }> = {
  entrada: {
    titulo: 'Nada para preparar',
    apoio: 'As novas oportunidades aparecem aqui.',
  },
  conversa: {
    titulo: 'Nenhuma descoberta em andamento',
    apoio: 'Mova para cá depois do primeiro contato.',
  },
  proposta: {
    titulo: 'Nenhuma proposta em andamento',
    apoio: 'Mova para cá quando o escopo estiver pronto.',
  },
};

function Vazio({ fase }: { fase: Exclude<IdFaseCrm, 'desfecho'> }) {
  const texto = TEXTO_VAZIO[fase];
  return (
    <div className={styles.vazio}>
      <span>{texto.titulo}</span>
      <small>{texto.apoio}</small>
    </div>
  );
}

export function ColunaAtiva({
  fase,
  numero,
  oportunidades,
  aoMover,
  movimentandoId,
  ativaNoMobile,
}: {
  fase: (typeof FASES_CRM)[number];
  numero: number;
  oportunidades: OportunidadeCrm[];
  aoMover: SolicitarMovimento;
  movimentandoId: string | null;
  ativaNoMobile: boolean;
}) {
  const faseAtiva = fase.id as Exclude<IdFaseCrm, 'desfecho'>;
  const etapa = ETAPA_DA_FASE[faseAtiva];
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
      data-mobile-ativa={ativaNoMobile || undefined}
      aria-labelledby={`coluna-${fase.id}`}
    >
      <header className={styles.colunaTopo}>
        <div>
          <span className={styles.faseNumero}>
            {String(numero).padStart(2, '0')} · método de venda
          </span>
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
          <Vazio fase={faseAtiva} />
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

export function BandejaDesfecho({ ganhas, perdidas }: { ganhas: number; perdidas: number }) {
  return (
    <section className={styles.bandejaDesfecho}>
      <div className={styles.bandejaTexto}>
        <span>Concluir venda</span>
        <strong>Solte no resultado</strong>
        <small>O motivo da perda será registrado.</small>
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
          <span>Oportunidades encerradas</span>
          <small>
            {ganhas} {ganhas === 1 ? 'ganha' : 'ganhas'} · {perdidas}{' '}
            {perdidas === 1 ? 'perdida' : 'perdidas'}
          </small>
        </div>
        <span className={styles.abrirHistorico}>
          Ver histórico
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

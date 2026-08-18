'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Move } from 'lucide-react';
import { Button, Modal, RadioGroup, ToastStack, type ToastItem } from '@/design-system/via';
import { moverOportunidadeKanban } from '@/lib/crm/actions';
import {
  FASES_CRM,
  MOTIVOS_PERDA_CRM,
  ROTULO_ETAPA,
  etapaVisivel,
  faseDaEtapa,
  type EtapaCrm,
  type IdFaseCrm,
  type MotivoPerdaCrm,
} from '@/lib/crm/etapas';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import { CartaoOverlay } from './KanbanCartao';
import { BandejaDesfecho, ColunaAtiva, HistoricoDesfechos } from './KanbanColunas';
import styles from './PipelineCrm.module.css';

const detectarDestino: CollisionDetection = (argumentos) => {
  const sobPonteiro = pointerWithin(argumentos);
  return sobPonteiro.length > 0 ? sobPonteiro : closestCorners(argumentos);
};

function etapaDoDestino(evento: DragEndEvent): EtapaCrm | null {
  const dados = evento.over?.data.current as { etapa?: unknown } | undefined;
  return typeof dados?.etapa === 'string' ? (dados.etapa as EtapaCrm) : null;
}

function rotuloDaMovimentacao(etapa: EtapaCrm, anterior: EtapaCrm): string {
  if (etapa === 'ganho') return 'Oportunidade marcada como ganha.';
  if (etapa === 'perdido') return 'Oportunidade marcada como perdida.';
  if (anterior === 'ganho' || anterior === 'perdido') return 'Oportunidade reaberta.';
  return `Oportunidade movida para ${ROTULO_ETAPA[etapa].toLowerCase()}.`;
}

export function PipelineCrm({ oportunidades }: { oportunidades: OportunidadeCrm[] }) {
  const [itens, setItens] = useState(oportunidades);
  const [ativoId, setAtivoId] = useState<string | null>(null);
  const [movimentandoId, setMovimentandoId] = useState<string | null>(null);
  const [perdaPendente, setPerdaPendente] = useState<OportunidadeCrm | null>(null);
  const [motivoPerda, setMotivoPerda] = useState<MotivoPerdaCrm | ''>('');
  const [erroMotivo, setErroMotivo] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [, iniciarTransicao] = useTransition();
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const porFase = useMemo(() => {
    const mapa = new Map<IdFaseCrm, OportunidadeCrm[]>();
    for (const fase of FASES_CRM) mapa.set(fase.id, []);
    for (const oportunidade of itens) {
      mapa.get(faseDaEtapa(oportunidade.etapa))?.push(oportunidade);
    }
    return mapa;
  }, [itens]);

  const ativas = FASES_CRM.filter((fase) => fase.id !== 'desfecho');
  const ganhas = itens.filter((oportunidade) => oportunidade.etapa === 'ganho');
  const perdidas = itens.filter((oportunidade) => oportunidade.etapa === 'perdido');
  const encerradas = itens.filter(
    (oportunidade) => oportunidade.etapa === 'ganho' || oportunidade.etapa === 'perdido',
  );
  const ativa = itens.find((oportunidade) => oportunidade.id === ativoId) ?? null;

  function publicarToast(toast: Omit<ToastItem, 'id'>) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((atuais) => [...atuais, { ...toast, id }]);
  }

  function fecharPerda() {
    setPerdaPendente(null);
    setMotivoPerda('');
    setErroMotivo('');
  }

  function executarMovimento(
    oportunidade: OportunidadeCrm,
    etapa: EtapaCrm,
    motivo?: MotivoPerdaCrm,
  ) {
    if (etapaVisivel(oportunidade.etapa) === etapa) return;

    const etapaAnterior = oportunidade.etapa;
    const instante = new Date().toISOString();
    setMovimentandoId(oportunidade.id);
    setItens((atuais) =>
      atuais.map((item) =>
        item.id === oportunidade.id
          ? {
              ...item,
              etapa,
              ganhaEm: etapa === 'ganho' ? instante : null,
              perdidaEm: etapa === 'perdido' ? instante : null,
              motivoPerda: etapa === 'perdido' ? (motivo ?? null) : null,
              ultimoFato:
                etapa === 'ganho'
                  ? 'Oportunidade marcada como ganha'
                  : etapa === 'perdido'
                    ? 'Oportunidade marcada como perdida'
                    : etapaAnterior === 'ganho' || etapaAnterior === 'perdido'
                      ? 'Oportunidade reaberta'
                      : 'Etapa do pipeline alterada',
              ultimoFatoEm: instante,
              atualizadoEm: instante,
            }
          : item,
      ),
    );

    iniciarTransicao(async () => {
      const resultado = await moverOportunidadeKanban({
        id: oportunidade.id,
        etapa,
        motivoPerda: motivo,
      });

      if (!resultado.ok) {
        setItens((atuais) =>
          atuais.map((item) => (item.id === oportunidade.id ? oportunidade : item)),
        );
        publicarToast({
          title: 'Movimento não concluído',
          message: resultado.erro,
          variant: 'warning',
        });
      } else {
        publicarToast({
          title: rotuloDaMovimentacao(etapa, etapaAnterior),
          message: oportunidade.empresa,
          variant: 'success',
        });
      }
      setMovimentandoId(null);
    });
  }

  function solicitarMovimento(oportunidade: OportunidadeCrm, etapa: EtapaCrm) {
    if (etapa === 'perdido') {
      setPerdaPendente(oportunidade);
      setMotivoPerda('');
      setErroMotivo('');
      return;
    }
    executarMovimento(oportunidade, etapa);
  }

  function confirmarPerda() {
    if (!perdaPendente) return;
    if (!motivoPerda) {
      setErroMotivo('Escolha o motivo para concluir o registro.');
      return;
    }
    const oportunidade = perdaPendente;
    const motivo = motivoPerda;
    fecharPerda();
    executarMovimento(oportunidade, 'perdido', motivo);
  }

  function encerrarArraste(evento: DragEndEvent) {
    const oportunidade = itens.find((item) => `card:${item.id}` === evento.active.id);
    const etapa = etapaDoDestino(evento);
    setAtivoId(null);
    if (!oportunidade || !etapa || etapaVisivel(oportunidade.etapa) === etapa) return;
    solicitarMovimento(oportunidade, etapa);
  }

  return (
    <>
      <DndContext
        id="crm-pipeline"
        sensors={sensores}
        collisionDetection={detectarDestino}
        onDragStart={({ active }) => setAtivoId(String(active.id).replace('card:', ''))}
        onDragCancel={() => setAtivoId(null)}
        onDragEnd={encerrarArraste}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              'Foque o card e pressione espaço para começar. Use as setas para escolher o destino e pressione espaço novamente para soltar.',
          },
          announcements: {
            onDragStart: ({ active }) => {
              const oportunidade = active.data.current?.oportunidade as OportunidadeCrm | undefined;
              return `Movendo ${oportunidade?.titulo ?? 'oportunidade'}.`;
            },
            onDragOver: ({ over }) => (over ? `Sobre ${String(over.id)}.` : 'Fora do quadro.'),
            onDragEnd: ({ over }) =>
              over ? `Movimento concluído em ${String(over.id)}.` : 'Movimento cancelado.',
            onDragCancel: () => 'Movimento cancelado.',
          },
        }}
      >
        <div className={styles.experienciaKanban} aria-label="Kanban comercial arrastável">
          <div className={styles.quadroKanban} data-arrastando={ativoId !== null || undefined}>
            <div className={styles.instrucaoKanban}>
              <Move size={15} strokeWidth={1.8} aria-hidden="true" />
              <span>Arraste por qualquer ponto do card.</span>
              <small>No celular, use o menu de ações.</small>
            </div>

            <BandejaDesfecho
              ganhas={ganhas.length}
              perdidas={perdidas.length}
              arrastando={ativoId !== null}
            />

            <div className={styles.rolagem}>
              <div className={styles.pipeline}>
                {ativas.map((fase, indice) => (
                  <ColunaAtiva
                    key={fase.id}
                    fase={fase}
                    numero={indice + 1}
                    oportunidades={porFase.get(fase.id) ?? []}
                    aoMover={solicitarMovimento}
                    movimentandoId={movimentandoId}
                  />
                ))}
              </div>
            </div>
          </div>

          <HistoricoDesfechos
            oportunidades={encerradas}
            aoMover={solicitarMovimento}
            movimentandoId={movimentandoId}
          />
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
          {ativa ? <CartaoOverlay oportunidade={ativa} /> : null}
        </DragOverlay>
      </DndContext>

      <Modal
        open={perdaPendente !== null}
        onClose={fecharPerda}
        title="Por que a oportunidade foi perdida?"
        description={
          perdaPendente ? `${perdaPendente.empresa} · ${perdaPendente.titulo}` : undefined
        }
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={fecharPerda} disabled={movimentandoId !== null}>
              Cancelar
            </Button>
            <Button onClick={confirmarPerda} disabled={movimentandoId !== null}>
              Registrar como perdida
            </Button>
          </>
        }
      >
        <div className={styles.modalPerda}>
          <p className={styles.contextoPerda}>
            O motivo ficará salvo no histórico. A oportunidade poderá ser reaberta depois.
          </p>
          <fieldset>
            <legend>Selecione o motivo principal</legend>
            <RadioGroup
              ariaLabel="Motivo da perda"
              name="motivo-perda"
              value={motivoPerda}
              onValueChange={(valor) => {
                setMotivoPerda(valor as MotivoPerdaCrm);
                setErroMotivo('');
              }}
              options={MOTIVOS_PERDA_CRM.map((motivo) => ({
                value: motivo.id,
                label: motivo.rotulo,
              }))}
            />
          </fieldset>
          {erroMotivo && (
            <p className={styles.erroMotivo} role="alert">
              {erroMotivo}
            </p>
          )}
        </div>
      </Modal>

      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((atuais) => atuais.filter((toast) => toast.id !== id))}
        position="bottom-right"
      />
    </>
  );
}

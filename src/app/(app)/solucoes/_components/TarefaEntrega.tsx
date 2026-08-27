'use client';

import { useActionState } from 'react';
import {
  Check,
  CircleDot,
  FileCheck2,
  Flag,
  Link2,
  LockKeyhole,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  atualizarTarefaProjeto,
  type EstadoProjetoExecucao,
} from '@/lib/projetos-execucao/actions';
import type { TarefaProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { EntregaCliente } from './EntregaCliente';
import styles from './SalaEntrega.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};

export function TarefaEntrega({
  projetoId,
  tarefa,
  portalAtivo,
  aceiteFinal,
}: {
  projetoId: string;
  tarefa: TarefaProjetoExecucao;
  portalAtivo: boolean;
  aceiteFinal: boolean;
}) {
  const [estado, acao, pendente] = useActionState(atualizarTarefaProjeto, ESTADO_INICIAL);
  const concluida = tarefa.status === 'concluida';
  const aguardandoCliente = tarefa.clienteStatus === 'aguardando';
  const aprovada = tarefa.clienteStatus === 'aprovada';
  const comAjustes = tarefa.clienteStatus === 'ajustes';
  const rotuloMomento = aprovada
    ? 'Aprovada pelo cliente'
    : aguardandoCliente
      ? 'Aguardando o cliente'
      : comAjustes
        ? 'Ajuste solicitado'
        : concluida
          ? 'Execução registrada'
          : tarefa.status === 'bloqueada'
            ? 'Bloqueio registrado'
            : tarefa.status === 'em_andamento'
              ? 'Em execução'
              : 'Próximo passo';

  return (
    <>
      <article id="tarefa-em-foco" className={styles.tarefa} data-status={tarefa.status}>
        <div className={styles.fluxoTarefa} aria-label="Fluxo desta tarefa">
          <span data-pronto={concluida || aguardandoCliente || aprovada || undefined}>
            <i>01</i> Executar
          </span>
          <span data-pronto={Boolean(tarefa.evidencia) || undefined}>
            <i>02</i> Registrar
          </span>
          <span
            data-ativo={(concluida && !aguardandoCliente && !aprovada) || undefined}
            data-pronto={aguardandoCliente || aprovada || undefined}
          >
            <i>03</i> Validar com o cliente
          </span>
        </div>

        <div className={styles.tarefaTopo}>
          <span className={styles.marcadorTarefa}>
            {concluida ? <Check size={17} /> : <CircleDot size={17} />}
          </span>
          <div>
            <p>{rotuloMomento}</p>
            <h2>{tarefa.titulo}</h2>
          </div>
        </div>

        <p className={styles.acao}>{tarefa.acao}</p>

        <dl className={styles.criterios}>
          <div>
            <dt>
              <Flag size={14} aria-hidden="true" /> Pronto quando
            </dt>
            <dd>{tarefa.concluidoQuando}</dd>
          </div>
          <div>
            <dt>
              <FileCheck2 size={14} aria-hidden="true" /> O que você entrega
            </dt>
            <dd>{tarefa.entregavel}</dd>
          </div>
        </dl>

        {concluida ? (
          <div className={styles.evidenciaRegistrada}>
            <div>
              <span>
                <Check size={15} aria-hidden="true" /> Evidência registrada
              </span>
              <p>{tarefa.evidencia}</p>
            </div>
            {!aguardandoCliente && !aprovada && (
              <form action={acao}>
                <input type="hidden" name="projeto" value={projetoId} />
                <input type="hidden" name="tarefa" value={tarefa.id} />
                <input type="hidden" name="evidencia" value={tarefa.evidencia ?? ''} />
                <button type="submit" name="status" value="em_andamento" disabled={pendente}>
                  <RotateCcw size={15} aria-hidden="true" />
                  {pendente ? 'Reabrindo…' : 'Reabrir para ajustar'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form action={acao} className={styles.evidencia}>
            <input type="hidden" name="projeto" value={projetoId} />
            <input type="hidden" name="tarefa" value={tarefa.id} />
            <label>
              <span>
                <Link2 size={14} aria-hidden="true" />
                {tarefa.status === 'bloqueada'
                  ? 'O que está impedindo o avanço?'
                  : comAjustes
                    ? 'Como você resolveu o ajuste?'
                    : 'Evidência do que você fez'}
              </span>
              <textarea
                name="evidencia"
                defaultValue={tarefa.evidencia ?? ''}
                maxLength={10_000}
                placeholder={
                  comAjustes
                    ? 'Descreva a correção e registre o novo teste antes de reenviar.'
                    : 'Registre o teste, o resultado observado e, se houver, cole o link do material.'
                }
              />
            </label>

            {estado.erro && (
              <p className={styles.erro} role="alert">
                {estado.erro}
              </p>
            )}
            {estado.sucesso && (
              <p className={styles.sucesso} role="status">
                {estado.sucesso}
              </p>
            )}

            <div className={styles.acoesTarefa}>
              <button type="submit" name="status" value="bloqueada" disabled={pendente}>
                <LockKeyhole size={15} aria-hidden="true" /> Registrar bloqueio
              </button>
              <button type="submit" name="status" value="em_andamento" disabled={pendente}>
                <Play size={15} aria-hidden="true" />
                {pendente
                  ? 'Salvando…'
                  : tarefa.status === 'pendente'
                    ? 'Começar tarefa'
                    : 'Salvar andamento'}
              </button>
              <button
                type="submit"
                name="status"
                value="concluida"
                className={styles.concluir}
                disabled={pendente}
              >
                <Check size={16} aria-hidden="true" />
                {pendente ? 'Concluindo…' : comAjustes ? 'Concluir ajuste' : 'Concluir execução'}
              </button>
            </div>
          </form>
        )}
      </article>

      <EntregaCliente
        projetoId={projetoId}
        tarefa={tarefa}
        portalAtivo={portalAtivo}
        aceiteFinal={aceiteFinal}
      />
    </>
  );
}

'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Link2,
  LockKeyhole,
  MessageSquareMore,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  atualizarTarefaProjeto,
  type EstadoProjetoExecucao,
} from '@/lib/projetos-execucao/actions';
import type {
  ArquivoProjetoExecucao,
  EventoProjetoExecucao,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';
import type { EncerramentoProjeto as Encerramento } from '@/lib/projetos-execucao/encerramento';
import { montarGuiaValidacaoTarefa } from '@/lib/projetos-execucao/validacao-tarefa';
import { EntregaCliente } from './EntregaCliente';
import { EncerramentoProjeto } from './EncerramentoProjeto';
import { KitOperacionalTarefa } from './KitOperacionalTarefa';
import styles from './SalaEntrega.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};

export function TarefaEntrega({
  projetoId,
  tarefa,
  portalAtivo,
  clienteEmail,
  notificacaoCliente,
  aceiteFinal,
  encerramento,
  contexto,
  onAbrirArquivos,
}: {
  projetoId: string;
  tarefa: TarefaProjetoExecucao;
  portalAtivo: boolean;
  clienteEmail: string | null;
  notificacaoCliente: EventoProjetoExecucao | null;
  aceiteFinal: boolean;
  encerramento: Encerramento | null;
  contexto: {
    empresa: string;
    objetivo: string;
    criterioSucesso: string;
    acessos: string[];
    limites: string[];
    arquivos: ArquivoProjetoExecucao[];
  };
  onAbrirArquivos: (tarefaId: string) => void;
}) {
  const [estado, acao, pendente] = useActionState(atualizarTarefaProjeto, ESTADO_INICIAL);
  const concluida = tarefa.status === 'concluida';
  const aguardandoCliente = tarefa.clienteStatus === 'aguardando';
  const aprovada = tarefa.clienteStatus === 'aprovada';
  const comAjustes = tarefa.clienteStatus === 'ajustes';
  const arquivosDaTarefa = contexto.arquivos.filter(
    (arquivo) => arquivo.tarefaId === tarefa.id,
  ).length;
  const guiaValidacao = montarGuiaValidacaoTarefa(tarefa);
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
        <header className={styles.tarefaTopo} data-on-dark>
          <div className={styles.tarefaTitulo}>
            <p>
              {tarefa.faseTitulo} · {rotuloMomento}
            </p>
            <h2>{tarefa.titulo}</h2>
            <strong>{tarefa.acao}</strong>
          </div>
          <Link href={`/consultor?projeto=${projetoId}&tarefa=${tarefa.id}`}>
            <Bot size={16} strokeWidth={1.8} aria-hidden="true" />
            Pedir ajuda
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </header>

        <section className={styles.resultadoTarefa} aria-labelledby="resultado-tarefa-titulo">
          <div>
            <p>Pronto quando</p>
            <h3 id="resultado-tarefa-titulo">{guiaValidacao.criterio}</h3>
          </div>
          <div>
            <p>Comprove com</p>
            <strong>{guiaValidacao.material}</strong>
          </div>
        </section>

        {comAjustes && tarefa.clienteComentario ? (
          <blockquote className={styles.retornoCliente}>
            <MessageSquareMore size={18} aria-hidden="true" />
            <span>
              <strong>Pedido do cliente</strong>
              {tarefa.clienteComentario}
            </span>
          </blockquote>
        ) : null}

        <details className={styles.contextoTarefa}>
          <summary>
            <span>
              <strong>Contexto de {contexto.empresa}</strong>
              <small>Objetivo, limites e materiais disponíveis</small>
            </span>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div>
            <dl>
              <div>
                <dt>Resultado do projeto</dt>
                <dd>{contexto.criterioSucesso || contexto.objetivo}</dd>
              </div>
              <div>
                <dt>Limite combinado</dt>
                <dd>{contexto.limites[0] ?? 'Nenhum limite foi registrado no briefing.'}</dd>
              </div>
              <div>
                <dt>Base disponível</dt>
                <dd>
                  {contexto.acessos.length} {contexto.acessos.length === 1 ? 'acesso' : 'acessos'} ·{' '}
                  {contexto.arquivos.length}{' '}
                  {contexto.arquivos.length === 1 ? 'arquivo' : 'arquivos'} no projeto
                </dd>
              </div>
            </dl>
            <Link href={`/consultor?projeto=${projetoId}&tarefa=${tarefa.id}`}>
              <Bot size={16} strokeWidth={1.8} aria-hidden="true" />
              Levar contexto ao Sobral AI
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </details>

        {tarefa.kitOperacional ? (
          <KitOperacionalTarefa
            kit={tarefa.kitOperacional}
            arquivosDaTarefa={arquivosDaTarefa}
            onAbrirArquivos={() => onAbrirArquivos(tarefa.id)}
          />
        ) : null}

        <section className={styles.validacaoTarefa} aria-labelledby="validacao-tarefa-titulo">
          <header>
            <div>
              <p>Registro da entrega</p>
              <h3 id="validacao-tarefa-titulo">
                {concluida ? 'Resultado registrado' : 'Comprove e conclua'}
              </h3>
            </div>
            <span>{concluida ? 'Concluído' : '1 comprovação'}</span>
          </header>

          {concluida ? (
            <div className={styles.evidenciaRegistrada}>
              <div>
                <span>
                  <Check size={15} aria-hidden="true" /> Teste e resultado registrados
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
                      ? 'Como você testou o ajuste?'
                      : 'Resultado e teste realizado'}
                </span>
                <textarea
                  name="evidencia"
                  defaultValue={tarefa.evidencia ?? ''}
                  maxLength={10_000}
                  placeholder={
                    comAjustes
                      ? 'Descreva a correção, o novo teste e o resultado antes de reenviar.'
                      : guiaValidacao.orientacaoRegistro
                  }
                />
              </label>

              <label className={styles.confirmacaoCriterio}>
                <input type="checkbox" name="criterioConfirmado" value="sim" />
                <span>
                  <strong>Revisei o resultado usando o critério acima.</strong>
                  <small>Esta confirmação será exigida somente ao concluir a tarefa.</small>
                </span>
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
                      ? 'Iniciar tarefa'
                      : 'Salvar'}
                </button>
                <button
                  type="submit"
                  name="status"
                  value="concluida"
                  className={styles.concluir}
                  disabled={pendente}
                >
                  <Check size={16} aria-hidden="true" />
                  {pendente ? 'Concluindo…' : comAjustes ? 'Concluir ajuste' : 'Concluir tarefa'}
                </button>
              </div>
              <p className={styles.depoisTarefa}>
                <ArrowRight size={14} aria-hidden="true" /> Depois, envie o resultado para o cliente
                validar.
              </p>
            </form>
          )}
        </section>
      </article>

      {aceiteFinal && concluida && (
        <EncerramentoProjeto
          projetoId={projetoId}
          encerramento={encerramento}
          evidenciaInicial={tarefa.evidencia}
        />
      )}

      <EntregaCliente
        projetoId={projetoId}
        tarefa={tarefa}
        portalAtivo={portalAtivo}
        clienteEmail={clienteEmail}
        notificacao={notificacaoCliente}
        aceiteFinal={aceiteFinal}
        encerramentoPronto={Boolean(encerramento)}
      />
    </>
  );
}

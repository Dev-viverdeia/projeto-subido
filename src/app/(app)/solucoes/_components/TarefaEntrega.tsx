'use client';

import Link from 'next/link';
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
  FileCheck2,
  Target,
} from 'lucide-react';
import { atualizarTarefaProjeto } from '@/lib/projetos-execucao/actions';
import { useFormularioEntrega } from '@/lib/projetos-execucao/use-formulario-entrega';
import { RetornoOperacao } from '../../_components/RetornoOperacao';
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

export function TarefaEntrega({
  projetoId,
  tarefa,
  portalAtivo,
  clienteEmail,
  notificacaoCliente,
  lembreteCliente,
  aceiteFinal,
  encerramento,
  contexto,
  onAbrirArquivos,
  onAbrirPortal,
}: {
  projetoId: string;
  tarefa: TarefaProjetoExecucao;
  portalAtivo: boolean;
  clienteEmail: string | null;
  notificacaoCliente: EventoProjetoExecucao | null;
  lembreteCliente: EventoProjetoExecucao | null;
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
  onAbrirPortal: () => void;
}) {
  const { estado, enviar, editar, pendente, bloqueado, operacao } =
    useFormularioEntrega(atualizarTarefaProjeto);
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
        <header className={styles.tarefaTopo}>
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
            <p>
              <Target size={18} aria-hidden="true" /> Pronto quando
            </p>
            <h3 id="resultado-tarefa-titulo">{guiaValidacao.criterio}</h3>
          </div>
          <div>
            <p>
              <FileCheck2 size={18} aria-hidden="true" /> Comprove com
            </p>
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
                <dd>
                  {contexto.limites.length
                    ? contexto.limites.join(' · ')
                    : 'Nenhum limite foi registrado no briefing.'}
                </dd>
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
              <h3 id="validacao-tarefa-titulo">
                {concluida ? 'Resultado registrado' : 'Comprove e conclua'}
              </h3>
            </div>
            {concluida && (
              <span>
                <Check size={16} aria-hidden="true" /> Concluído
              </span>
            )}
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
                <form onSubmit={enviar}>
                  <input type="hidden" name="projeto" value={projetoId} />
                  <input type="hidden" name="tarefa" value={tarefa.id} />
                  <input type="hidden" name="evidencia" value={tarefa.evidencia ?? ''} />
                  <button type="submit" name="status" value="em_andamento" disabled={bloqueado}>
                    <RotateCcw size={15} aria-hidden="true" />
                    {pendente ? 'Reabrindo…' : 'Reabrir para ajustar'}
                  </button>
                </form>
              )}
              {estado.erro && (
                <RetornoOperacao
                  tom="erro"
                  titulo="Alteração não confirmada"
                  descricao={estado.erro}
                />
              )}
            </div>
          ) : (
            <form
              onSubmit={enviar}
              onChange={editar}
              aria-busy={pendente || undefined}
              className={styles.evidencia}
            >
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
                  disabled={pendente}
                  placeholder={
                    comAjustes
                      ? 'Descreva a correção, o novo teste e o resultado antes de reenviar.'
                      : guiaValidacao.orientacaoRegistro
                  }
                />
              </label>

              <label className={styles.confirmacaoCriterio}>
                <input type="checkbox" name="criterioConfirmado" value="sim" disabled={pendente} />
                <span>
                  <strong>Revisei o resultado usando o critério acima.</strong>
                  <small>Necessário para concluir.</small>
                </span>
              </label>

              {estado.erro && (
                <RetornoOperacao
                  tom="erro"
                  titulo="Registro não confirmado"
                  descricao={estado.erro}
                />
              )}
              {estado.sucesso && (
                <p className={styles.sucesso} role="status">
                  {estado.sucesso}
                </p>
              )}

              <div className={styles.acoesTarefa}>
                <button type="submit" name="status" value="bloqueada" disabled={bloqueado}>
                  <LockKeyhole size={15} aria-hidden="true" />{' '}
                  {pendente && operacao === 'bloqueada' ? 'Registrando…' : 'Registrar bloqueio'}
                </button>
                <button type="submit" name="status" value="em_andamento" disabled={bloqueado}>
                  <Play size={15} aria-hidden="true" />
                  {pendente && operacao === 'em_andamento'
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
                  disabled={bloqueado}
                >
                  <Check size={16} aria-hidden="true" />
                  {pendente && operacao === 'concluida'
                    ? 'Concluindo…'
                    : comAjustes
                      ? 'Concluir ajuste'
                      : 'Concluir tarefa'}
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
        <EncerramentoProjeto projetoId={projetoId} encerramento={encerramento} />
      )}

      <EntregaCliente
        onAbrirPortal={onAbrirPortal}
        projetoId={projetoId}
        tarefa={tarefa}
        portalAtivo={portalAtivo}
        clienteEmail={clienteEmail}
        notificacao={notificacaoCliente}
        lembrete={lembreteCliente}
        aceiteFinal={aceiteFinal}
        encerramentoPronto={Boolean(encerramento)}
      />
    </>
  );
}

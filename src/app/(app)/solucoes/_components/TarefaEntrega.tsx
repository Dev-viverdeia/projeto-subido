'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  CircleDot,
  Link2,
  LockKeyhole,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  atualizarTarefaProjeto,
  type EstadoProjetoExecucao,
} from '@/lib/projetos-execucao/actions';
import type {
  ArquivoProjetoExecucao,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';
import { montarGuiaValidacaoTarefa } from '@/lib/projetos-execucao/validacao-tarefa';
import { EntregaCliente } from './EntregaCliente';
import { KitOperacionalTarefa } from './KitOperacionalTarefa';
import styles from './SalaEntrega.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};

export function TarefaEntrega({
  projetoId,
  tarefa,
  portalAtivo,
  aceiteFinal,
  contexto,
  onAbrirArquivos,
}: {
  projetoId: string;
  tarefa: TarefaProjetoExecucao;
  portalAtivo: boolean;
  aceiteFinal: boolean;
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
        <div className={styles.fluxoTarefa} aria-label="Fluxo desta tarefa">
          <span data-pronto={concluida || aguardandoCliente || aprovada || undefined}>
            <i>01</i> Executar
          </span>
          <span data-pronto={Boolean(tarefa.evidencia) || undefined}>
            <i>02</i> Registrar resultado
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

        <div className={styles.comoExecutar}>
          <p>Como executar</p>
          <strong>{tarefa.acao}</strong>
        </div>

        <section className={styles.contextoTarefa} aria-labelledby="contexto-tarefa-titulo">
          <header>
            <div>
              <p>Antes de começar</p>
              <h3 id="contexto-tarefa-titulo">O que importa para {contexto.empresa}</h3>
            </div>
            <Link href={`/consultor?projeto=${projetoId}&tarefa=${tarefa.id}`}>
              <Bot size={16} strokeWidth={1.8} aria-hidden="true" />
              Pedir ajuda nesta tarefa
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </header>

          <dl>
            <div>
              <dt>Resultado esperado</dt>
              <dd>{contexto.criterioSucesso || contexto.objetivo}</dd>
            </div>
            <div>
              <dt>Cuidado combinado</dt>
              <dd>{contexto.limites[0] ?? 'Nenhum limite foi registrado no briefing.'}</dd>
            </div>
            <div>
              <dt>Base disponível</dt>
              <dd>
                {contexto.acessos.length} {contexto.acessos.length === 1 ? 'acesso' : 'acessos'} ·{' '}
                {contexto.arquivos.length} {contexto.arquivos.length === 1 ? 'arquivo' : 'arquivos'}{' '}
                no projeto
              </dd>
            </div>
          </dl>
        </section>

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
              <p>Antes de concluir</p>
              <h3 id="validacao-tarefa-titulo">Confira o resultado desta tarefa</h3>
            </div>
            <span>{concluida ? 'Resultado registrado' : '2 pontos para revisar'}</span>
          </header>

          <dl className={styles.criterios}>
            <div>
              <dt>Critério de qualidade</dt>
              <dd>{guiaValidacao.criterio}</dd>
            </div>
            <div>
              <dt>Material para revisão</dt>
              <dd>{guiaValidacao.material}</dd>
            </div>
          </dl>

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
                      : 'Teste realizado e resultado'}
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
        </section>
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

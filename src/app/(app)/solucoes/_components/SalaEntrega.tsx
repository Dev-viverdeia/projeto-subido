'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleDot,
  FileCheck2,
  FileSignature,
  Flag,
  FolderKanban,
  Link2,
  LockKeyhole,
  Play,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  atualizarTarefaProjeto,
  definirPrazoProjeto,
  type EstadoProjetoExecucao,
} from '@/lib/projetos-execucao/actions';
import type {
  ProjetoExecucaoCompleto,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_PROJETO, ROTULO_STATUS_TAREFA } from '@/lib/projetos-execucao/status';
import { formatarReais } from '@/lib/propostas/schema';
import { EntregaCliente } from './EntregaCliente';
import { CentralArquivos } from './CentralArquivos';
import { PlanoVivo } from './PlanoVivo';
import { PortalClienteCard } from './PortalClienteCard';
import styles from './SalaEntrega.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(valor))
    .replace('.', '');
}

function dataParaCampo(valor: string | null): string {
  return valor ? new Date(valor).toISOString().slice(0, 10) : '';
}

export function SalaEntrega({ projeto }: { projeto: ProjetoExecucaoCompleto }) {
  const fases = useMemo(
    () =>
      projeto.tarefas.reduce<
        Array<{ id: string; titulo: string; tarefas: TarefaProjetoExecucao[] }>
      >((lista, tarefa) => {
        const existente = lista.find((fase) => fase.id === tarefa.faseId);
        if (existente) existente.tarefas.push(tarefa);
        else lista.push({ id: tarefa.faseId, titulo: tarefa.faseTitulo, tarefas: [tarefa] });
        return lista;
      }, []),
    [projeto.tarefas],
  );
  const proxima = projeto.tarefas.find((tarefa) => tarefa.status !== 'concluida') ?? null;
  const proximoCompromisso = projeto.acoesPlano.find((acao) => acao.status === 'pendente') ?? null;
  const faseInicial = fases.find((fase) => fase.id === proxima?.faseId) ?? fases[0] ?? null;
  const [faseId, setFaseId] = useState(faseInicial?.id ?? '');
  const faseAtual = fases.find((fase) => fase.id === faseId) ?? faseInicial;
  const tarefaInicial =
    faseAtual?.tarefas.find((tarefa) => tarefa.status !== 'concluida') ??
    faseAtual?.tarefas[0] ??
    null;
  const [tarefaId, setTarefaId] = useState(tarefaInicial?.id ?? '');
  const tarefaAtual =
    faseAtual?.tarefas.find((tarefa) => tarefa.id === tarefaId) ??
    faseAtual?.tarefas.find((tarefa) => tarefa.status !== 'concluida') ??
    faseAtual?.tarefas[0] ??
    null;
  const percentual = projeto.total ? Math.round((projeto.feitas / projeto.total) * 100) : 0;
  const ultimaTarefa = projeto.tarefas.at(-1) ?? null;

  function abrirFase(id: string) {
    const nova = fases.find((fase) => fase.id === id);
    setFaseId(id);
    setTarefaId(
      nova?.tarefas.find((tarefa) => tarefa.status !== 'concluida')?.id ??
        nova?.tarefas[0]?.id ??
        '',
    );
  }

  return (
    <div className={styles.sala}>
      <header className={styles.hero} data-on-dark>
        <div className={styles.heroTexto}>
          <div className={styles.heroLinha}>
            <p className={styles.eyebrow}>Sala de Entrega · {projeto.empresa}</p>
            <span className={styles.statusProjeto} data-status={projeto.status}>
              {ROTULO_STATUS_PROJETO[projeto.status]}
            </span>
          </div>
          <h1>{projeto.titulo}</h1>
          <p>{projeto.documento.projeto.resumo}</p>

          <dl className={styles.heroMetadados}>
            <div>
              <dt>Início</dt>
              <dd>{formatarData(projeto.inicioEm)}</dd>
            </div>
            <div>
              <dt>Prazo</dt>
              <dd>{projeto.prazoEm ? formatarData(projeto.prazoEm) : 'A definir'}</dd>
            </div>
            <div>
              <dt>Investimento</dt>
              <dd>{formatarReais(projeto.documento.investimento.valorCentavos)}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.medida} aria-label={`${percentual}% do projeto concluído`}>
          <span>{percentual}%</span>
          <strong>
            {projeto.feitas} de {projeto.total}
          </strong>
          <small>tarefas comprovadas</small>
          <div aria-hidden="true">
            <span style={{ transform: `scaleX(${percentual / 100})` }} />
          </div>
        </div>

        <nav className={styles.fases} aria-label="Fases da entrega">
          {fases.map((fase, indice) => {
            const feitas = fase.tarefas.filter((tarefa) => tarefa.status === 'concluida').length;
            const completa = feitas === fase.tarefas.length;
            const ativa = fase.id === faseAtual?.id;
            return (
              <button
                type="button"
                key={fase.id}
                data-ativa={ativa || undefined}
                data-completa={completa || undefined}
                aria-current={ativa ? 'step' : undefined}
                onClick={() => abrirFase(fase.id)}
              >
                <span>{completa ? <Check size={13} /> : String(indice + 1).padStart(2, '0')}</span>
                <strong>{fase.titulo}</strong>
                <small>
                  {feitas}/{fase.tarefas.length}
                </small>
              </button>
            );
          })}
        </nav>
      </header>

      <div className={styles.corpo}>
        <main className={styles.operacao}>
          <header className={styles.cabecalhoFase}>
            <div>
              <p>Agora na entrega</p>
              <h2>{faseAtual?.titulo ?? 'Projeto concluído'}</h2>
            </div>
            {faseAtual && (
              <span>
                {faseAtual.tarefas.filter((tarefa) => tarefa.status === 'concluida').length}/
                {faseAtual.tarefas.length} prontas
              </span>
            )}
          </header>

          {tarefaAtual ? (
            <TarefaEmFoco
              key={tarefaAtual.id}
              projetoId={projeto.id}
              tarefa={tarefaAtual}
              portalAtivo={projeto.portalAtivo}
              aceiteFinal={tarefaAtual.id === ultimaTarefa?.id && projeto.feitas === projeto.total}
            />
          ) : (
            <div className={styles.semTarefa}>
              <Check size={24} aria-hidden="true" />
              <h2>Entrega concluída</h2>
              <p>Todos os passos têm evidência registrada.</p>
            </div>
          )}

          {faseAtual && faseAtual.tarefas.length > 1 && (
            <section className={styles.fila} aria-labelledby="fila-titulo">
              <div className={styles.filaCabecalho}>
                <p>Fila desta fase</p>
                <h2 id="fila-titulo">Tudo que precisa acontecer</h2>
              </div>
              <ol>
                {faseAtual.tarefas.map((tarefa, indice) => (
                  <li key={tarefa.id}>
                    <button
                      type="button"
                      data-ativa={tarefa.id === tarefaAtual?.id || undefined}
                      data-concluida={tarefa.status === 'concluida' || undefined}
                      onClick={() => setTarefaId(tarefa.id)}
                    >
                      <span>
                        {tarefa.status === 'concluida' ? <Check size={13} /> : indice + 1}
                      </span>
                      <strong>{tarefa.titulo}</strong>
                      <small>{ROTULO_STATUS_TAREFA[tarefa.status]}</small>
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </main>

        <aside className={styles.lateral}>
          <section className={styles.proximaAcao}>
            <p>{proximoCompromisso ? 'Próximo compromisso' : 'Próxima tarefa'}</p>
            {proximoCompromisso ? (
              <>
                <strong>{proximoCompromisso.titulo}</strong>
                <span>Plano vivo do cliente</span>
              </>
            ) : proxima ? (
              <>
                <strong>{proxima.titulo}</strong>
                <span>{proxima.faseTitulo}</span>
              </>
            ) : (
              <strong>Formalizar a entrega final</strong>
            )}
          </section>

          <PrazoProjeto projetoId={projeto.id} prazo={projeto.prazoEm} />

          <PortalClienteCard
            projetoId={projeto.id}
            ativo={projeto.portalAtivo}
            codigo={projeto.portalCodigo}
          />

          <section className={styles.cliente}>
            <p>Contexto aprovado</p>
            <h2>{projeto.empresa}</h2>
            <blockquote>{projeto.documento.objetivo}</blockquote>
            <div>
              <Link href={`/crm/${projeto.oportunidadeId}`}>
                <FolderKanban size={15} aria-hidden="true" /> Abrir no CRM
              </Link>
              <Link href={`/propostas/${projeto.propostaId}`}>
                <FileSignature size={15} aria-hidden="true" /> Ver proposta
              </Link>
            </div>
          </section>

          <section className={styles.entregaveis}>
            <p>Entrega combinada</p>
            <ul>
              {projeto.documento.entregaveis.map((entregavel) => (
                <li key={entregavel}>
                  <FileCheck2 size={15} aria-hidden="true" /> {entregavel}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <PlanoVivo projetoId={projeto.id} acoes={projeto.acoesPlano} />

      <CentralArquivos
        projetoId={projeto.id}
        tarefas={projeto.tarefas}
        arquivos={projeto.arquivos}
        eventos={projeto.eventos}
        concluido={projeto.status === 'concluido'}
      />
    </div>
  );
}

function TarefaEmFoco({
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

  return (
    <>
      <article className={styles.tarefa} data-status={tarefa.status}>
        <div className={styles.tarefaTopo}>
          <span className={styles.marcadorTarefa}>
            {tarefa.status === 'concluida' ? <Check size={17} /> : <CircleDot size={17} />}
          </span>
          <div>
            <p>{ROTULO_STATUS_TAREFA[tarefa.status]}</p>
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

        <form action={acao} className={styles.evidencia}>
          <input type="hidden" name="projeto" value={projetoId} />
          <input type="hidden" name="tarefa" value={tarefa.id} />
          <label>
            <span>
              <Link2 size={14} aria-hidden="true" /> Evidência da execução
            </span>
            <textarea
              name="evidencia"
              defaultValue={tarefa.evidencia ?? ''}
              maxLength={10_000}
              placeholder="Cole o link, registre o teste realizado ou descreva o aceite do cliente."
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
            {tarefa.status === 'concluida' ? (
              <button type="submit" name="status" value="em_andamento" disabled={pendente}>
                <RotateCcw size={15} aria-hidden="true" /> Reabrir tarefa
              </button>
            ) : (
              <>
                <button type="submit" name="status" value="bloqueada" disabled={pendente}>
                  <LockKeyhole size={15} aria-hidden="true" /> Registrar bloqueio
                </button>
                <button type="submit" name="status" value="em_andamento" disabled={pendente}>
                  <Play size={15} aria-hidden="true" /> Salvar andamento
                </button>
                <button
                  type="submit"
                  name="status"
                  value="concluida"
                  className={styles.concluir}
                  disabled={pendente}
                >
                  <Check size={16} aria-hidden="true" /> Concluir com evidência
                </button>
              </>
            )}
          </div>
        </form>
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

function PrazoProjeto({ projetoId, prazo }: { projetoId: string; prazo: string | null }) {
  const [estado, acao, pendente] = useActionState(definirPrazoProjeto, ESTADO_INICIAL);
  return (
    <section className={styles.prazo}>
      <p>
        <CalendarDays size={15} aria-hidden="true" /> Prazo da entrega
      </p>
      <form action={acao}>
        <input type="hidden" name="projeto" value={projetoId} />
        <input type="date" name="prazo" defaultValue={dataParaCampo(prazo)} />
        <button type="submit" disabled={pendente} aria-label="Salvar prazo">
          <Save size={15} aria-hidden="true" />
        </button>
      </form>
      {estado.erro && <small role="alert">{estado.erro}</small>}
      {estado.sucesso && <small role="status">{estado.sucesso}</small>}
    </section>
  );
}

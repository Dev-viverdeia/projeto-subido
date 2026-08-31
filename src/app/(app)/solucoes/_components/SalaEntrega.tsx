'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, FolderOpen, Play, UsersRound } from 'lucide-react';
import type {
  ProjetoExecucaoCompleto,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';
import {
  obterEstadoJornadaEntrega,
  type DestinoJornadaEntrega,
} from '@/lib/projetos-execucao/jornada-entrega';
import { ROTULO_STATUS_PROJETO, ROTULO_STATUS_TAREFA } from '@/lib/projetos-execucao/status';
import { obterContatoNotificacao } from '@/lib/projetos-execucao/notificacao-cliente';
import {
  contarDependenciasPendentes,
  obterProximoCompromisso,
} from '@/lib/projetos-execucao/plano';
import { formatarDataProjeto } from '@/lib/projetos-execucao/prazo';
import { formatarReais } from '@/lib/propostas/schema';
import { CentralArquivos } from './CentralArquivos';
import { JornadaEntrega } from './JornadaEntrega';
import { PainelClienteEntrega } from './PainelClienteEntrega';
import { PlanoVivo } from './PlanoVivo';
import { TarefaEntrega } from './TarefaEntrega';
import { resumirEscopoSala } from './sala-entrega-resumo';
import styles from './SalaEntrega.module.css';

type PainelSala = 'execucao' | 'arquivos' | 'cliente';

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
  const proximoCompromisso = obterProximoCompromisso(projeto.acoesPlano);
  const faseInicial =
    fases.find((fase) => fase.id === proxima?.faseId) ??
    (projeto.feitas === projeto.total ? fases.at(-1) : fases[0]) ??
    null;
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
  const briefingConfirmado = Boolean(projeto.briefing.confirmadoEm);
  const [painel, setPainel] = useState<PainelSala>(
    briefingConfirmado && projeto.feitas > 0 ? 'execucao' : 'cliente',
  );
  const [arquivoTarefaId, setArquivoTarefaId] = useState<string | null>(null);
  const entregasAguardando = projeto.tarefas.filter(
    (tarefa) => tarefa.clienteStatus === 'aguardando',
  ).length;
  const ajustesSolicitados = projeto.tarefas.filter(
    (tarefa) => tarefa.clienteStatus === 'ajustes',
  ).length;
  const dependenciasPendentes = contarDependenciasPendentes(projeto.acoesPlano);
  const { investimentoAtual, rotuloCliente } = resumirEscopoSala({
    mudancas: projeto.mudancasEscopo,
    investimentoBase: projeto.documento.investimento.valorCentavos,
    briefingConfirmado,
    ajustes: ajustesSolicitados,
    dependencias: dependenciasPendentes,
    validacoes: entregasAguardando,
    portalAtivo: projeto.portalAtivo,
  });
  // prettier-ignore
  const contatoCliente = obterContatoNotificacao(projeto.eventos, tarefaAtual?.id, projeto.documento.cliente.email);
  const estadoJornada = obterEstadoJornadaEntrega({
    status: projeto.status,
    briefingConfirmado,
    tarefas: projeto.tarefas,
    compromisso: proximoCompromisso?.titulo ?? null,
    dependencias: projeto.acoesPlano,
  });

  function abrirFase(id: string) {
    const nova = fases.find((fase) => fase.id === id);
    setFaseId(id);
    setTarefaId(
      nova?.tarefas.find((tarefa) => tarefa.status !== 'concluida')?.id ??
        nova?.tarefas[0]?.id ??
        '',
    );
    setPainel('execucao');
  }

  function abrirProximaAcao() {
    if (proximoCompromisso) {
      document.getElementById('plano-vivo-titulo')?.scrollIntoView?.({ behavior: 'smooth' });
      return;
    }

    const alvo = proxima ?? ultimaTarefa;
    if (!alvo) return;

    setPainel('execucao');
    setFaseId(alvo.faseId);
    setTarefaId(alvo.id);
    requestAnimationFrame(() =>
      document.getElementById('tarefa-em-foco')?.scrollIntoView?.({ behavior: 'smooth' }),
    );
  }

  function abrirAcaoJornada(destino: DestinoJornadaEntrega, tarefaAlvo: string | null) {
    if (destino === 'briefing') {
      setPainel('cliente');
      requestAnimationFrame(() =>
        document.getElementById('briefing-kickoff')?.scrollIntoView?.({ behavior: 'smooth' }),
      );
      return;
    }

    if (destino === 'preparacao') {
      setPainel('cliente');
      requestAnimationFrame(() =>
        document.getElementById('preparacao-titulo')?.scrollIntoView?.({ behavior: 'smooth' }),
      );
      return;
    }

    if (destino === 'arquivos') {
      setArquivoTarefaId(null);
      setPainel('arquivos');
      return;
    }

    if (destino === 'compromisso') {
      document.getElementById('plano-vivo-titulo')?.scrollIntoView?.({ behavior: 'smooth' });
      return;
    }

    const alvo = projeto.tarefas.find((tarefa) => tarefa.id === tarefaAlvo) ?? ultimaTarefa;
    if (!alvo) return;

    setPainel('execucao');
    setFaseId(alvo.faseId);
    setTarefaId(alvo.id);
    requestAnimationFrame(() =>
      document.getElementById('tarefa-em-foco')?.scrollIntoView?.({ behavior: 'smooth' }),
    );
  }

  function abrirArquivosDaTarefa(tarefaAlvo: string) {
    setArquivoTarefaId(tarefaAlvo);
    setPainel('arquivos');
  }

  return (
    <div className={styles.sala}>
      <header className={styles.hero} data-on-dark>
        <div className={styles.heroTexto}>
          <div className={styles.heroLinha}>
            <p className={styles.eyebrow}>Entrega do cliente · {projeto.empresa}</p>
            <span className={styles.statusProjeto} data-status={projeto.status}>
              {ROTULO_STATUS_PROJETO[projeto.status]}
            </span>
          </div>
          <h1>{projeto.titulo}</h1>
          <p>{projeto.documento.projeto.resumo}</p>

          <dl className={styles.heroMetadados}>
            <div>
              <dt>Início</dt>
              <dd>{formatarDataProjeto(projeto.inicioEm)}</dd>
            </div>
            <div>
              <dt>Prazo</dt>
              <dd>{projeto.prazoEm ? formatarDataProjeto(projeto.prazoEm) : 'A definir'}</dd>
            </div>
            <div>
              <dt>Investimento</dt>
              <dd>{formatarReais(investimentoAtual)}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.medida} aria-label={`${percentual}% da entrega concluída`}>
          <span>{percentual}%</span>
          <strong>
            {projeto.feitas} de {projeto.total}
          </strong>
          <small>tarefas concluídas</small>
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

      <nav className={styles.paineis} aria-label="Áreas da entrega">
        <button
          type="button"
          data-ativo={painel === 'execucao' || undefined}
          aria-current={painel === 'execucao' ? 'page' : undefined}
          onClick={() => setPainel('execucao')}
        >
          <Play size={17} aria-hidden="true" />
          <span>
            <strong>Executar</strong>
            <small>
              {projeto.status === 'concluido'
                ? 'Entrega encerrada'
                : (proxima?.titulo ?? 'Aceite final')}
            </small>
          </span>
        </button>
        <button
          type="button"
          data-ativo={painel === 'arquivos' || undefined}
          aria-current={painel === 'arquivos' ? 'page' : undefined}
          onClick={() => {
            setArquivoTarefaId(null);
            setPainel('arquivos');
          }}
        >
          <FolderOpen size={17} aria-hidden="true" />
          <span>
            <strong>Arquivos</strong>
            <small>
              {projeto.arquivos.length} {projeto.arquivos.length === 1 ? 'arquivo' : 'arquivos'}
            </small>
          </span>
        </button>
        <button
          type="button"
          data-ativo={painel === 'cliente' || undefined}
          aria-current={painel === 'cliente' ? 'page' : undefined}
          onClick={() => setPainel('cliente')}
        >
          <UsersRound size={17} aria-hidden="true" />
          <span>
            <strong>Cliente e escopo</strong>
            <small>{rotuloCliente}</small>
          </span>
        </button>
      </nav>

      {painel === 'execucao' && (
        <>
          {!briefingConfirmado && (
            <section className={styles.avisoBriefing} role="status">
              <div>
                <strong>Confirme o combinado antes de executar.</strong>
                <span>Objetivo, responsáveis, acessos e limites precisam estar claros.</span>
              </div>
              <button type="button" onClick={() => setPainel('cliente')}>
                Revisar briefing <ArrowRight size={15} aria-hidden="true" />
              </button>
            </section>
          )}

          <div className={styles.corpo}>
            <main className={styles.operacao}>
              <header className={styles.cabecalhoFase}>
                <div>
                  <p>Trabalho de agora</p>
                  <h2>{faseAtual?.titulo ?? 'Encerrar a entrega'}</h2>
                </div>
                {faseAtual && (
                  <span>
                    {faseAtual.tarefas.filter((tarefa) => tarefa.status === 'concluida').length}/
                    {faseAtual.tarefas.length} prontas nesta fase
                  </span>
                )}
              </header>

              {tarefaAtual ? (
                <TarefaEntrega
                  key={tarefaAtual.id}
                  projetoId={projeto.id}
                  tarefa={tarefaAtual}
                  portalAtivo={projeto.portalAtivo}
                  clienteEmail={contatoCliente.email}
                  notificacaoCliente={contatoCliente.evento}
                  contexto={{
                    empresa: projeto.empresa,
                    objetivo: projeto.briefing.objetivo || projeto.documento.objetivo,
                    criterioSucesso: projeto.briefing.criterioSucesso,
                    acessos: projeto.briefing.acessos,
                    limites: projeto.briefing.limites,
                    arquivos: projeto.arquivos,
                  }}
                  onAbrirArquivos={abrirArquivosDaTarefa}
                  aceiteFinal={
                    tarefaAtual.id === ultimaTarefa?.id && projeto.feitas === projeto.total
                  }
                  encerramento={projeto.encerramento}
                />
              ) : (
                <div className={styles.semTarefa}>
                  <Check size={24} aria-hidden="true" />
                  <h2>Entrega concluída</h2>
                  <p>Todas as tarefas foram executadas e registradas.</p>
                </div>
              )}

              {faseAtual && faseAtual.tarefas.length > 1 && (
                <section className={styles.fila} aria-labelledby="fila-titulo">
                  <div className={styles.filaCabecalho}>
                    <p>Sequência da fase</p>
                    <h2 id="fila-titulo">Próximos passos</h2>
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
              <JornadaEntrega
                estado={estadoJornada}
                onAbrir={() => abrirAcaoJornada(estadoJornada.destino, estadoJornada.tarefaId)}
              />

              <section className={styles.resumoOperacional}>
                <p>Resumo da entrega</p>
                <dl>
                  <div>
                    <dt>Prazo</dt>
                    <dd>{projeto.prazoEm ? formatarDataProjeto(projeto.prazoEm) : 'A definir'}</dd>
                  </div>
                  <div>
                    <dt>Arquivos</dt>
                    <dd>{projeto.arquivos.length}</dd>
                  </div>
                  <div>
                    <dt>Cliente</dt>
                    <dd>{projeto.portalAtivo ? 'Portal ativo' : 'Portal privado'}</dd>
                  </div>
                </dl>
                <button type="button" onClick={() => setPainel('cliente')}>
                  Ver acordo e portal <ArrowRight size={14} aria-hidden="true" />
                </button>
              </section>
            </aside>
          </div>

          <PlanoVivo projetoId={projeto.id} acoes={projeto.acoesPlano} />
        </>
      )}

      {painel === 'arquivos' && (
        <CentralArquivos
          projetoId={projeto.id}
          tarefas={projeto.tarefas}
          arquivos={projeto.arquivos}
          eventos={projeto.eventos}
          concluido={projeto.status === 'concluido'}
          tarefaInicialId={arquivoTarefaId}
        />
      )}

      {painel === 'cliente' && (
        <div className={styles.painelCliente}>
          <PainelClienteEntrega
            projeto={projeto}
            primeiraTarefa={proxima?.titulo ?? null}
            onComecar={abrirProximaAcao}
          />
        </div>
      )}
    </div>
  );
}

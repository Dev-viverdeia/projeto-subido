'use client';

import { useMemo, useState } from 'react';
import { ListTodo } from 'lucide-react';
import type {
  ProjetoExecucaoCompleto,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';
import {
  obterEstadoJornadaEntrega,
  type DestinoJornadaEntrega,
} from '@/lib/projetos-execucao/jornada-entrega';
import { obterContatoNotificacao } from '@/lib/projetos-execucao/notificacao-cliente';
import { obterProximoCompromisso } from '@/lib/projetos-execucao/plano';
import { estaEmAcompanhamento } from '@/lib/projetos-execucao/gestao';
import { GestaoServico } from './GestaoServico';
import { CabecalhoEntrega } from './CabecalhoEntrega';
import { PendenciasClienteEntrega, contarPendenciasCliente } from './PendenciasClienteEntrega';
import { AcompanhamentoEntrega } from './AcompanhamentoEntrega';
import { CentralArquivos } from './CentralArquivos';
import { EvolucaoProjeto } from './EvolucaoProjeto';
import { FasesEntrega } from './FasesEntrega';
import { JornadaEntrega } from './JornadaEntrega';
import { NavegacaoSalaEntrega, type PainelSala } from './NavegacaoSalaEntrega';
import { PainelClienteEntrega } from './PainelClienteEntrega';
import { PlanoVivo } from './PlanoVivo';
import { TarefaEntrega } from './TarefaEntrega';
import styles from './SalaEntrega.module.css';

type PropsSalaEntrega = {
  projeto: ProjetoExecucaoCompleto;
  tarefaSolicitada?: string;
};

function revelarSecao(id: string) {
  requestAnimationFrame(() => {
    const reduzirMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const alvo = document.getElementById(id);
    if (!alvo) return;
    const detalhes = alvo.closest('details');
    if (detalhes) detalhes.open = true;
    alvo.setAttribute('tabindex', '-1');
    alvo.focus({ preventScroll: true });
    alvo.scrollIntoView?.({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'start' });
  });
}

export function SalaEntrega({ projeto, tarefaSolicitada }: PropsSalaEntrega) {
  const tarefaDoLink = projeto.tarefas.find((tarefa) => tarefa.id === tarefaSolicitada);
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
    fases.find((fase) => fase.id === tarefaDoLink?.faseId) ??
    fases.find((fase) => fase.id === proxima?.faseId) ??
    (projeto.feitas === projeto.total ? fases.at(-1) : fases[0]);
  const [faseId, setFaseId] = useState(faseInicial?.id ?? '');
  const faseAtual = fases.find((fase) => fase.id === faseId) ?? faseInicial;
  const [tarefaId, setTarefaId] = useState(
    tarefaDoLink?.id ?? proxima?.id ?? faseAtual?.tarefas[0]?.id ?? '',
  );
  const tarefaAtual =
    faseAtual?.tarefas.find((tarefa) => tarefa.id === tarefaId) ??
    faseAtual?.tarefas.find((tarefa) => tarefa.status !== 'concluida') ??
    faseAtual?.tarefas[0] ??
    null;
  const ultimaTarefa = projeto.tarefas.at(-1) ?? null;
  const briefingConfirmado = Boolean(projeto.briefing.confirmadoEm);
  const trabalhoIniciado = projeto.tarefas.some(
    (tarefa) => tarefa.status !== 'pendente' || tarefa.clienteStatus !== 'nao_solicitada',
  );
  const [painelSalvo, setPainel] = useState<PainelSala>(() => {
    if (tarefaDoLink) return 'execucao';
    if (projeto.status === 'concluido')
      return estaEmAcompanhamento(projeto) || projeto.encerramento?.status === 'encerrado'
        ? 'evolucao'
        : 'arquivos';
    return briefingConfirmado && trabalhoIniciado ? 'execucao' : 'cliente';
  });
  const podeMostrarEvolucao =
    projeto.status === 'concluido' &&
    (estaEmAcompanhamento(projeto) || projeto.encerramento?.status === 'encerrado');
  const painel =
    painelSalvo === 'evolucao' && !podeMostrarEvolucao
      ? projeto.status === 'concluido'
        ? 'arquivos'
        : 'execucao'
      : painelSalvo;
  const preparandoProjeto =
    !trabalhoIniciado && projeto.status !== 'concluido' && painel === 'cliente';
  const [arquivoTarefaId, setArquivoTarefaId] = useState<string | null>(null);
  // prettier-ignore
  const contatoCliente = obterContatoNotificacao(projeto.eventos, tarefaAtual?.id, projeto.documento.cliente.email);
  const estadoJornada = obterEstadoJornadaEntrega({
    status: projeto.status,
    aceiteConfirmado: projeto.encerramento?.status === 'encerrado',
    briefingConfirmado,
    tarefas: projeto.tarefas,
    compromisso: proximoCompromisso?.titulo ?? null,
    dependencias: projeto.acoesPlano,
  });
  const mostrarPrioridade =
    estadoJornada.tom !== 'normal' ||
    estadoJornada.destino !== 'tarefa' ||
    estadoJornada.tarefaId !== tarefaAtual?.id;

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
    const alvo = proxima ?? ultimaTarefa;
    if (!alvo) return;

    setPainel('execucao');
    setFaseId(alvo.faseId);
    setTarefaId(alvo.id);
    revelarSecao('tarefa-em-foco');
  }

  function abrirAcaoJornada(destino: DestinoJornadaEntrega, tarefaAlvo: string | null) {
    if (destino === 'briefing') {
      setPainel('cliente');
      revelarSecao('briefing-kickoff');
      return;
    }

    if (destino === 'preparacao') {
      setPainel('cliente');
      revelarSecao(briefingConfirmado ? 'preparacao-titulo' : 'briefing-kickoff');
      return;
    }

    if (destino === 'escopo') {
      setPainel('cliente');
      revelarSecao('mudancas-escopo-titulo');
      return;
    }

    if (destino === 'arquivos') {
      setArquivoTarefaId(null);
      setPainel('arquivos');
      return;
    }

    if (destino === 'compromisso') {
      setPainel('execucao');
      revelarSecao('plano-vivo-titulo');
      return;
    }

    const alvo = projeto.tarefas.find((tarefa) => tarefa.id === tarefaAlvo) ?? ultimaTarefa;
    if (!alvo) return;

    setPainel('execucao');
    setFaseId(alvo.faseId);
    setTarefaId(alvo.id);
    revelarSecao(
      destino === 'validacao' && alvo.clienteStatus === 'aguardando'
        ? 'validacao-cliente'
        : 'tarefa-em-foco',
    );
  }

  function abrirArquivosDaTarefa(tarefaAlvo: string) {
    setArquivoTarefaId(tarefaAlvo);
    setPainel('arquivos');
  }

  return (
    <div className={styles.sala}>
      <CabecalhoEntrega projeto={projeto} preparando={preparandoProjeto}>
        <GestaoServico
          compacto
          projeto={projeto}
          onConcluir={() =>
            setPainel(projeto.tipoServico === 'recorrente' ? 'evolucao' : 'arquivos')
          }
        />
      </CabecalhoEntrega>

      {!preparandoProjeto && (
        <NavegacaoSalaEntrega
          painel={painel}
          concluido={projeto.status === 'concluido'}
          recorrente={estaEmAcompanhamento(projeto)}
          mostrarEvolucao={podeMostrarEvolucao}
          totalArquivos={projeto.arquivos.length}
          pendenciasCliente={contarPendenciasCliente(projeto)}
          onChange={(proximoPainel) => {
            if (proximoPainel === 'arquivos') setArquivoTarefaId(null);
            setPainel(proximoPainel);
          }}
        />
      )}

      {painel === 'execucao' && (
        <>
          <div className={styles.corpo}>
            {mostrarPrioridade && (
              <JornadaEntrega
                estado={estadoJornada}
                onAbrir={() => abrirAcaoJornada(estadoJornada.destino, estadoJornada.tarefaId)}
              />
            )}

            <div className={styles.mesa}>
              {fases.length > 0 && (
                <FasesEntrega
                  fases={fases}
                  faseAtualId={faseAtual?.id}
                  tarefaAtualId={tarefaAtual?.id}
                  onAbrir={abrirFase}
                  onAbrirTarefa={setTarefaId}
                />
              )}
              <section className={styles.operacao} aria-label="Tarefa em foco">
                {tarefaAtual ? (
                  <TarefaEntrega
                    key={tarefaAtual.id}
                    projetoId={projeto.id}
                    tarefa={tarefaAtual}
                    portalAtivo={projeto.portalAtivo}
                    clienteEmail={contatoCliente.email}
                    notificacaoCliente={contatoCliente.evento}
                    lembreteCliente={contatoCliente.lembrete}
                    contexto={{
                      empresa: projeto.empresa,
                      objetivo: projeto.briefing.objetivo || projeto.documento.objetivo,
                      criterioSucesso: projeto.briefing.criterioSucesso,
                      acessos: projeto.briefing.acessos,
                      limites: projeto.briefing.limites,
                      arquivos: projeto.arquivos,
                    }}
                    onAbrirArquivos={abrirArquivosDaTarefa}
                    onAbrirPortal={() => {
                      setPainel('cliente');
                      revelarSecao('portal-cliente');
                    }}
                    aceiteFinal={
                      tarefaAtual.id === ultimaTarefa?.id && projeto.feitas === projeto.total
                    }
                    encerramento={projeto.encerramento}
                  />
                ) : (
                  <div className={styles.semTarefa}>
                    <ListTodo size={24} aria-hidden="true" />
                    <h2>Nenhuma tarefa disponível</h2>
                    <p>Consulte o escopo e os arquivos deste projeto.</p>
                  </div>
                )}
              </section>
            </div>
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
          <PendenciasClienteEntrega projeto={projeto} onAbrir={abrirAcaoJornada} />
          <PainelClienteEntrega
            trabalhoIniciado={trabalhoIniciado}
            projeto={projeto}
            primeiraTarefa={proxima?.titulo ?? null}
            onComecar={abrirProximaAcao}
          />
        </div>
      )}

      {painel === 'evolucao' && estaEmAcompanhamento(projeto) ? (
        <AcompanhamentoEntrega projeto={projeto} />
      ) : (
        painel === 'evolucao' && (
          <EvolucaoProjeto
            projetoId={projeto.id}
            empresa={projeto.empresa}
            encerramento={projeto.encerramento}
            evolucao={projeto.evolucao}
          />
        )
      )}
    </div>
  );
}

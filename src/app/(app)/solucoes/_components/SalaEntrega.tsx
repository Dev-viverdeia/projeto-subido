'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ListTodo } from 'lucide-react';
import type {
  ProjetoExecucaoCompleto,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';
import {
  obterEstadoJornadaEntrega,
  type DestinoJornadaEntrega,
} from '@/lib/projetos-execucao/jornada-entrega';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { obterContatoNotificacao } from '@/lib/projetos-execucao/notificacao-cliente';
import {
  contarDependenciasPendentes,
  obterProximoCompromisso,
} from '@/lib/projetos-execucao/plano';
import { formatarDataProjeto } from '@/lib/projetos-execucao/prazo';
import { estaEmAcompanhamento } from '@/lib/projetos-execucao/gestao';
import { GestaoServico } from './GestaoServico';
import { AcompanhamentoEntrega } from './AcompanhamentoEntrega';
import { CentralArquivos } from './CentralArquivos';
import { EvolucaoProjeto } from './EvolucaoProjeto';
import { FasesEntrega } from './FasesEntrega';
import { JornadaEntrega } from './JornadaEntrega';
import { NavegacaoSalaEntrega, type PainelSala } from './NavegacaoSalaEntrega';
import { PainelClienteEntrega } from './PainelClienteEntrega';
import { PlanoVivo } from './PlanoVivo';
import { TarefaEntrega } from './TarefaEntrega';
import { resumirEscopoSala } from './sala-entrega-resumo';
import styles from './SalaEntrega.module.css';

type PropsSalaEntrega = {
  projeto: ProjetoExecucaoCompleto;
  tarefaSolicitada?: string;
};

function revelarSecao(id: string) {
  requestAnimationFrame(() => {
    const reduzirMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById(id)
      ?.scrollIntoView?.({ behavior: reduzirMovimento ? 'auto' : 'smooth' });
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
  const percentual = projeto.total ? Math.round((projeto.feitas / projeto.total) * 100) : 0;
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
  const entregasAguardando = projeto.tarefas.filter(
    (tarefa) => tarefa.clienteStatus === 'aguardando',
  ).length;
  const ajustesSolicitados = projeto.tarefas.filter(
    (tarefa) => tarefa.clienteStatus === 'ajustes',
  ).length;
  const dependenciasPendentes = contarDependenciasPendentes(projeto.acoesPlano);
  const { rotuloCliente } = resumirEscopoSala({
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
      revelarSecao('preparacao-titulo');
      return;
    }

    if (destino === 'arquivos') {
      setArquivoTarefaId(null);
      setPainel('arquivos');
      return;
    }

    if (destino === 'compromisso') {
      revelarSecao('plano-vivo-titulo');
      return;
    }

    const alvo = projeto.tarefas.find((tarefa) => tarefa.id === tarefaAlvo) ?? ultimaTarefa;
    if (!alvo) return;

    setPainel('execucao');
    setFaseId(alvo.faseId);
    setTarefaId(alvo.id);
    revelarSecao('tarefa-em-foco');
  }

  function abrirArquivosDaTarefa(tarefaAlvo: string) {
    setArquivoTarefaId(tarefaAlvo);
    setPainel('arquivos');
  }

  return (
    <div className={styles.sala}>
      {preparandoProjeto ? (
        <header className={styles.inicioHero}>
          <div className={styles.inicioNavegacao}>
            <Link href="/entregas">
              <ArrowLeft size={16} aria-hidden="true" /> Entregas
            </Link>
            <span>Preparação</span>
          </div>
          <div className={styles.inicioHeroCorpo}>
            <div className={styles.inicioHeroTexto}>
              <p>Entrega · {projeto.empresa}</p>
              <h1>{projeto.titulo}</h1>
              <span>O escopo aprovado já virou projeto. Confirme três pontos para começar.</span>
            </div>
          </div>
        </header>
      ) : projeto.status !== 'concluido' ? (
        <header className={styles.heroFoco}>
          <div className={styles.heroFocoNavegacao}>
            <Link href="/entregas">
              <ArrowLeft size={16} aria-hidden="true" /> Entregas
            </Link>
            <span className={styles.statusProjetoFoco} data-status={projeto.status}>
              {ROTULO_STATUS_PROJETO[projeto.status]}
            </span>
          </div>

          <div className={styles.heroFocoPrincipal}>
            <div className={styles.heroFocoTexto}>
              <p>{projeto.empresa}</p>
              <h1>{projeto.titulo}</h1>
              <span>
                Prazo: {projeto.prazoEm ? formatarDataProjeto(projeto.prazoEm) : 'a definir'}
              </span>
            </div>
            <div
              className={styles.progressoFoco}
              aria-label={`${percentual}% da entrega concluída`}
            >
              <div>
                <span>Progresso</span>
                <strong>{percentual}%</strong>
              </div>
              <small>
                {projeto.feitas} de {projeto.total} tarefas
              </small>
              <div className={styles.progressoTrilho} aria-hidden="true">
                <span style={{ transform: `scaleX(${percentual / 100})` }} />
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className={styles.heroFoco}>
          <div className={styles.heroFocoNavegacao}>
            <Link href="/entregas">
              <ArrowLeft size={16} aria-hidden="true" /> Entregas
            </Link>
            <span>
              {projeto.encerramento?.status === 'encerrado'
                ? 'Aceite registrado'
                : 'Entrega registrada por você'}
            </span>
          </div>
          <div className={styles.inicioHeroCorpo}>
            <div className={styles.heroFocoTexto}>
              <p>{projeto.empresa}</p>
              <h1>{projeto.titulo}</h1>
              {projeto.concluidoEm && (
                <span>Entregue em {formatarDataProjeto(projeto.concluidoEm)}</span>
              )}
            </div>
          </div>
        </header>
      )}

      {!preparandoProjeto && (
        <NavegacaoSalaEntrega
          painel={painel}
          concluido={projeto.status === 'concluido'}
          evolucaoRegistrada={projeto.evolucao?.status === 'registrada'}
          recorrente={estaEmAcompanhamento(projeto)}
          mostrarEvolucao={podeMostrarEvolucao}
          proximaTarefa={proxima?.titulo ?? null}
          totalArquivos={projeto.arquivos.length}
          rotuloCliente={rotuloCliente}
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

      <GestaoServico
        projeto={projeto}
        onConcluir={() => setPainel(projeto.tipoServico === 'recorrente' ? 'evolucao' : 'arquivos')}
      />
    </div>
  );
}

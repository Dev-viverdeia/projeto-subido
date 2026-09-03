import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  FileCheck2,
  LockKeyhole,
} from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/servico';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { AprovacaoCliente } from './AprovacaoCliente';
import { AcordoProjetoPortal } from './AcordoProjetoPortal';
import { PendenciaCliente } from './PendenciaCliente';
import { ControleEscopoPortal, DecisaoMudancaEscopo } from './MudancaEscopoPortal';
import { TermoEncerramentoPortal } from './TermoEncerramentoPortal';
import { PosEntregaPortal } from './PosEntregaPortal';
import styles from './portal.module.css';
import layout from './PortalProjeto.module.css';

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(valor))
    .replace('.', '');
}

export function PortalProjeto({
  codigo,
  projeto,
}: {
  codigo: string;
  projeto: ProjetoPortalCliente;
}) {
  const percentual = projeto.total ? Math.round((projeto.feitas / projeto.total) * 100) : 0;
  const fases = projeto.tarefas.reduce<
    Array<{ id: string; titulo: string; total: number; feitas: number }>
  >((lista, tarefa) => {
    const fase = lista.find((item) => item.id === tarefa.faseId);
    if (fase) {
      fase.total += 1;
      if (tarefa.status === 'concluida') fase.feitas += 1;
    } else {
      lista.push({
        id: tarefa.faseId,
        titulo: tarefa.faseTitulo,
        total: 1,
        feitas: tarefa.status === 'concluida' ? 1 : 0,
      });
    }
    return lista;
  }, []);
  const ultimaTarefa = projeto.tarefas.at(-1) ?? null;
  const aprovacoes = projeto.tarefas.filter((tarefa) => tarefa.clienteStatus === 'aguardando');
  const dependencias = projeto.dependencias.filter((acao) => acao.status === 'pendente');
  const mudancasAguardando = projeto.mudancasEscopo.filter(
    (mudanca) => mudanca.status === 'aguardando_cliente',
  );
  const totalAcoes = aprovacoes.length + dependencias.length + mudancasAguardando.length;
  const compartilhadas = projeto.tarefas.filter((tarefa) =>
    ['aguardando', 'aprovada', 'ajustes'].includes(tarefa.clienteStatus),
  );
  const faseAtual = fases.find((fase) => fase.feitas < fase.total) ?? fases.at(-1) ?? null;
  const concluido = projeto.status === 'concluido';
  const apenasAprovacao = aprovacoes.length === totalAcoes && aprovacoes.length > 0;
  const apenasDependencia = dependencias.length === totalAcoes && dependencias.length > 0;
  const tituloDecisao = concluido
    ? 'Projeto concluído.'
    : !totalAcoes
      ? 'Nenhuma ação pendente.'
      : apenasAprovacao && totalAcoes === 1
        ? 'Revise esta entrega.'
        : mudancasAguardando.length === totalAcoes
          ? 'Revise a mudança no projeto.'
          : apenasDependencia
            ? `${totalAcoes} ${totalAcoes === 1 ? 'item precisa' : 'itens precisam'} da sua confirmação.`
            : `${totalAcoes} ${totalAcoes === 1 ? 'item aguarda' : 'itens aguardam'} sua resposta.`;
  const descricaoDecisao = concluido
    ? 'Materiais, suporte e próximos passos continuam disponíveis abaixo.'
    : !totalAcoes
      ? 'Avisaremos quando uma nova entrega estiver pronta para você.'
      : apenasAprovacao
        ? 'Confira o resultado e aprove ou descreva o ajuste necessário.'
        : mudancasAguardando.length
          ? 'Confira o impacto informado antes de decidir.'
          : 'Confirme os itens concluídos para o projeto continuar.';

  return (
    <main className={layout.pagina}>
      <header className={layout.barra}>
        <SubidoLogo size={19} />
        <div>
          <LockKeyhole size={13} aria-hidden="true" />
          Acesso protegido
        </div>
      </header>

      <div className={layout.canvas}>
        <section className={layout.hero} data-concluido={concluido || undefined}>
          <div className={layout.heroTexto}>
            <p>{projeto.empresa}</p>
            <h1>{projeto.titulo}</h1>
            <p className={layout.resumo}>{projeto.resumo}</p>

            <dl>
              <div>
                <dt>Início</dt>
                <dd>{formatarData(projeto.inicioEm)}</dd>
              </div>
              <div>
                <dt>Previsão</dt>
                <dd>{projeto.prazoEm ? formatarData(projeto.prazoEm) : 'Em definição'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{ROTULO_STATUS_PROJETO[projeto.status]}</dd>
              </div>
            </dl>
          </div>

          <div className={layout.progressoHero}>
            <span>{percentual}%</span>
            <strong>{concluido ? 'concluído' : 'do projeto'}</strong>
            <div aria-hidden="true">
              <i style={{ transform: `scaleX(${percentual / 100})` }} />
            </div>
            <small>
              {projeto.feitas} de {projeto.total} etapas
            </small>
          </div>
        </section>

        <section
          className={layout.centralDecisoes}
          data-concluido={concluido || undefined}
          aria-labelledby="decisoes-titulo"
        >
          <header>
            <div className={layout.iconeDecisao} data-pendente={totalAcoes > 0 || undefined}>
              {concluido ? (
                <BadgeCheck size={20} />
              ) : totalAcoes ? (
                <Clock3 size={20} />
              ) : (
                <Check size={20} />
              )}
            </div>
            <div>
              <p>{totalAcoes ? 'Sua resposta' : 'Status do projeto'}</p>
              <h2 id="decisoes-titulo">{tituloDecisao}</h2>
              <span>{descricaoDecisao}</span>
            </div>
          </header>

          {totalAcoes ? (
            <div className={layout.listaAprovacoes}>
              {mudancasAguardando.map((mudanca) => (
                <DecisaoMudancaEscopo key={mudanca.id} codigo={codigo} mudanca={mudanca} />
              ))}
              {dependencias.map((acao) => (
                <PendenciaCliente key={acao.id} codigo={codigo} acao={acao} />
              ))}
              {aprovacoes.map((tarefa) => (
                <AprovacaoCliente
                  key={tarefa.id}
                  codigo={codigo}
                  tarefa={tarefa}
                  aceiteFinal={tarefa.id === ultimaTarefa?.id && projeto.feitas === projeto.total}
                  encerramento={projeto.encerramento}
                />
              ))}
            </div>
          ) : (
            <div className={layout.estadoDecisao}>
              <span>
                {concluido
                  ? 'Aceite registrado'
                  : `Em andamento: ${faseAtual?.titulo ?? 'Entrega'}`}
              </span>
              <strong>{concluido ? projeto.titulo : projeto.objetivo}</strong>
            </div>
          )}
        </section>

        <details className={layout.grupoDetalhes}>
          <summary>
            <div>
              <strong>Sobre o projeto</strong>
              <span>Objetivo e combinados</span>
            </div>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={layout.grupoConteudo}>
            <AcordoProjetoPortal briefing={projeto.briefing} />
            <ControleEscopoPortal codigo={codigo} mudancas={projeto.mudancasEscopo} />
          </div>
        </details>

        <details className={layout.grupoDetalhes} open={!totalAcoes && !concluido}>
          <summary>
            <div>
              <strong>Andamento</strong>
              <span>{projeto.feitas} marcos concluídos</span>
            </div>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={`${styles.painel} ${layout.painel}`}>
            <section className={styles.andamento} aria-labelledby="andamento-titulo">
              <header>
                <div>
                  <p>Visão do trabalho</p>
                  <h2 id="andamento-titulo">Da descoberta à entrega.</h2>
                </div>
                <span>Atualizado em tempo real</span>
              </header>

              <ol>
                {fases.map((fase, indice) => {
                  const completa = fase.feitas === fase.total;
                  const ativa = !concluido && fase.id === faseAtual?.id;
                  return (
                    <li
                      key={fase.id}
                      data-completa={completa || undefined}
                      data-ativa={ativa || undefined}
                    >
                      <span>
                        {completa ? <Check size={14} /> : String(indice + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <strong>{fase.titulo}</strong>
                        <small>
                          {fase.feitas}/{fase.total} marcos concluídos
                        </small>
                      </div>
                      {ativa && <em>Agora</em>}
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className={styles.biblioteca} aria-labelledby="entregas-titulo">
              <header>
                <p>Histórico compartilhado</p>
                <h2 id="entregas-titulo">Entregas do projeto</h2>
              </header>

              {compartilhadas.length ? (
                <ol>
                  {compartilhadas.map((tarefa) => (
                    <li key={tarefa.id} data-status={tarefa.clienteStatus}>
                      <span className={styles.marcaEntrega}>
                        {tarefa.clienteStatus === 'aprovada' ? (
                          <Check size={15} />
                        ) : tarefa.clienteStatus === 'aguardando' ? (
                          <Clock3 size={15} />
                        ) : (
                          <CircleDot size={15} />
                        )}
                      </span>
                      <div>
                        <small>{tarefa.faseTitulo}</small>
                        <strong>{tarefa.titulo}</strong>
                        {tarefa.clienteNota && <p>{tarefa.clienteNota}</p>}
                      </div>
                      {tarefa.entregavelUrl && (
                        <a href={tarefa.entregavelUrl} target="_blank" rel="noreferrer">
                          Abrir <ArrowUpRight size={14} />
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className={styles.vazio}>
                  <FileCheck2 size={20} aria-hidden="true" />
                  <p>A primeira entrega aparecerá aqui assim que estiver pronta para você.</p>
                </div>
              )}
            </section>
          </div>
        </details>

        <details className={layout.grupoDetalhes}>
          <summary>
            <div>
              <strong>Resultados</strong>
              <span>{concluido ? 'Encerramento do projeto' : 'Próximos passos'}</span>
            </div>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={layout.grupoConteudo}>
            {concluido && projeto.encerramento ? (
              <div className={styles.encerramentoPortal}>
                <TermoEncerramentoPortal encerramento={projeto.encerramento} />
              </div>
            ) : null}

            <PosEntregaPortal codigo={codigo} projeto={projeto} concluido={concluido} />
          </div>
        </details>
      </div>

      <footer className={layout.rodape}>
        <SubidoLogo size={16} />
        <span>Acesso protegido</span>
      </footer>
    </main>
  );
}

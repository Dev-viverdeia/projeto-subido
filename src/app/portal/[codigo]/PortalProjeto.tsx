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
import { descreverProximaAcaoPortal } from '@/lib/portal-cliente/eventos';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/servico';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { AprovacaoCliente } from './AprovacaoCliente';
import { AcordoProjetoPortal } from './AcordoProjetoPortal';
import { PendenciaCliente } from './PendenciaCliente';
import { ControleEscopoPortal, DecisaoMudancaEscopo } from './MudancaEscopoPortal';
import { TermoEncerramentoPortal } from './TermoEncerramentoPortal';
import { PosEntregaPortal } from './PosEntregaPortal';
import styles from './portal.module.css';

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

  return (
    <main className={styles.pagina}>
      <header className={styles.barra}>
        <SubidoLogo size={19} />
        <div>
          <LockKeyhole size={13} aria-hidden="true" />
          Portal protegido
        </div>
      </header>

      <div className={styles.canvas}>
        <section
          className={styles.centralDecisoes}
          data-concluido={concluido || undefined}
          aria-labelledby="decisoes-titulo"
        >
          <header>
            <div className={styles.iconeDecisao} data-pendente={totalAcoes > 0 || undefined}>
              {concluido ? (
                <BadgeCheck size={20} />
              ) : totalAcoes ? (
                <Clock3 size={20} />
              ) : (
                <Check size={20} />
              )}
            </div>
            <div>
              <p>Sua próxima ação</p>
              <h2 id="decisoes-titulo">
                {concluido
                  ? 'Projeto entregue e aprovado.'
                  : totalAcoes
                    ? `${totalAcoes} ${totalAcoes === 1 ? 'ação espera' : 'ações esperam'} por você.`
                    : 'Tudo em dia por aqui.'}
              </h2>
              <span>
                {descreverProximaAcaoPortal(concluido, totalAcoes, mudancasAguardando.length)}
              </span>
            </div>
          </header>

          {totalAcoes ? (
            <div className={styles.listaAprovacoes}>
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
            <div className={styles.estadoDecisao}>
              <span>
                {concluido ? 'Aceite final registrado' : `Agora: ${faseAtual?.titulo ?? 'Entrega'}`}
              </span>
              <strong>{concluido ? projeto.titulo : projeto.objetivo}</strong>
            </div>
          )}
        </section>

        <section className={styles.hero} data-concluido={concluido || undefined}>
          <div className={styles.heroTexto}>
            <p>Projeto em parceria com {projeto.empresa}</p>
            <h1>{projeto.titulo}</h1>
            <blockquote>{projeto.resumo}</blockquote>

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

          <div className={styles.progressoHero}>
            <span>{percentual}%</span>
            <strong>{concluido ? 'entregue e aprovado' : 'do projeto concluído'}</strong>
            <div aria-hidden="true">
              <i style={{ transform: `scaleX(${percentual / 100})` }} />
            </div>
            <small>
              {projeto.feitas} de {projeto.total} marcos executados
            </small>
          </div>
        </section>

        <details className={styles.grupoDetalhes}>
          <summary>
            <div>
              <strong>Escopo e combinados</strong>
              <span>Objetivo, entregáveis e mudanças</span>
            </div>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={styles.grupoConteudo}>
            <AcordoProjetoPortal briefing={projeto.briefing} />
            <ControleEscopoPortal codigo={codigo} mudancas={projeto.mudancasEscopo} />
          </div>
        </details>

        <details className={styles.grupoDetalhes}>
          <summary>
            <div>
              <strong>Andamento e entregas</strong>
              <span>{projeto.feitas} marcos concluídos</span>
            </div>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={styles.painel}>
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

        <details className={styles.grupoDetalhes}>
          <summary>
            <div>
              <strong>Resultado e continuidade</strong>
              <span>{concluido ? 'Encerramento do projeto' : 'Próximos passos'}</span>
            </div>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={styles.grupoConteudo}>
            {concluido && projeto.encerramento ? (
              <div className={styles.encerramentoPortal}>
                <TermoEncerramentoPortal encerramento={projeto.encerramento} />
              </div>
            ) : null}

            <PosEntregaPortal codigo={codigo} projeto={projeto} concluido={concluido} />
          </div>
        </details>
      </div>

      <footer className={styles.rodape}>
        <SubidoLogo size={16} />
        <span>Portal protegido</span>
      </footer>
    </main>
  );
}

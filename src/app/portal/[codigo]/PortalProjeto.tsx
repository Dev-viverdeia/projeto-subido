import { ArrowUpRight, Check, CircleDot, Clock3, FileCheck2, LockKeyhole } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/servico';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { AprovacaoCliente } from './AprovacaoCliente';
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
  const aprovacoes = projeto.tarefas.filter((tarefa) => tarefa.clienteStatus === 'aguardando');
  const compartilhadas = projeto.tarefas.filter((tarefa) =>
    ['aguardando', 'aprovada', 'ajustes'].includes(tarefa.clienteStatus),
  );
  const faseAtual = fases.find((fase) => fase.feitas < fase.total) ?? fases.at(-1) ?? null;

  return (
    <main className={styles.pagina}>
      <header className={styles.barra}>
        <SubidoLogo size={19} />
        <div>
          <LockKeyhole size={13} aria-hidden="true" />
          Link individual · ambiente protegido
        </div>
      </header>

      <div className={styles.canvas}>
        <section className={styles.hero}>
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
            <strong>do projeto concluído</strong>
            <div aria-hidden="true">
              <i style={{ transform: `scaleX(${percentual / 100})` }} />
            </div>
            <small>
              {projeto.feitas} de {projeto.total} marcos executados
            </small>
          </div>
        </section>

        <section className={styles.momento}>
          <div>
            <p>Momento atual</p>
            <h2>{faseAtual?.titulo ?? 'Entrega concluída'}</h2>
          </div>
          <blockquote>{projeto.objetivo}</blockquote>
        </section>

        <div className={styles.colunas}>
          <div className={styles.principal}>
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
                  const ativa = fase.id === faseAtual?.id;
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

          <aside className={styles.lateral}>
            <section className={styles.caixaAprovacoes}>
              <header>
                <p>Sua participação</p>
                <h2>{aprovacoes.length ? 'Há uma decisão esperando.' : 'Tudo em dia por aqui.'}</h2>
              </header>

              {aprovacoes.length ? (
                <div className={styles.listaAprovacoes}>
                  {aprovacoes.map((tarefa) => (
                    <AprovacaoCliente key={tarefa.id} codigo={codigo} tarefa={tarefa} />
                  ))}
                </div>
              ) : (
                <div className={styles.semAprovacao}>
                  <Check size={18} aria-hidden="true" />
                  <p>Quando uma entrega precisar do seu aceite, ela aparecerá neste espaço.</p>
                </div>
              )}
            </section>

            <section className={styles.seguranca}>
              <LockKeyhole size={16} aria-hidden="true" />
              <div>
                <strong>Um portal, somente o necessário.</strong>
                <p>Notas internas, CRM e evidências de trabalho não aparecem neste link.</p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <footer className={styles.rodape}>
        <SubidoLogo size={16} />
        <span>Projeto conduzido com transparência, evidência e aprovação humana.</span>
      </footer>
    </main>
  );
}

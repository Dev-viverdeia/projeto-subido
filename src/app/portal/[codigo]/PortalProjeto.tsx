import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleDot,
  Clock3,
  Download,
  FileCheck2,
  FileUp,
  Files,
  History,
  LockKeyhole,
  MessageSquareText,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { EventoPortalCliente, ProjetoPortalCliente } from '@/lib/portal-cliente/servico';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import { AprovacaoCliente } from './AprovacaoCliente';
import styles from './portal.module.css';

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date(valor))
    .replace('.', '');
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

function rotuloArquivo(mime: string): string {
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') {
    return 'Planilha';
  }
  if (mime.startsWith('image/')) return 'Imagem';
  if (mime.startsWith('video/')) return 'Vídeo';
  if (mime.startsWith('audio/')) return 'Áudio';
  if (mime.includes('zip')) return 'Pacote';
  return 'Documento';
}

const ROTULO_EVENTO: Record<EventoPortalCliente['tipo'], string> = {
  aprovacao_solicitada: 'Entrega pronta para sua revisão',
  entrega_aprovada: 'Entrega aprovada por você',
  ajustes_solicitados: 'Ajuste solicitado',
  arquivo_liberado: 'Novo arquivo disponível',
};

function formatarMomento(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(valor))
    .replace('.', '');
}

function IconeEvento({ tipo }: { tipo: EventoPortalCliente['tipo'] }) {
  if (tipo === 'entrega_aprovada') return <BadgeCheck size={17} aria-hidden="true" />;
  if (tipo === 'ajustes_solicitados') return <MessageSquareText size={17} aria-hidden="true" />;
  if (tipo === 'arquivo_liberado') return <FileUp size={17} aria-hidden="true" />;
  return <Send size={17} aria-hidden="true" />;
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
          Link individual · ambiente protegido
        </div>
      </header>

      <div className={styles.canvas}>
        <section
          className={styles.centralDecisoes}
          data-concluido={concluido || undefined}
          aria-labelledby="decisoes-titulo"
        >
          <header>
            <div className={styles.iconeDecisao} data-pendente={aprovacoes.length > 0 || undefined}>
              {concluido ? (
                <BadgeCheck size={20} />
              ) : aprovacoes.length ? (
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
                  : aprovacoes.length
                    ? `${aprovacoes.length} ${aprovacoes.length === 1 ? 'decisão espera' : 'decisões esperam'} por você.`
                    : 'Tudo em dia por aqui.'}
              </h2>
              <span>
                {concluido
                  ? 'O aceite final foi registrado. Os materiais continuam disponíveis neste portal.'
                  : aprovacoes.length
                    ? 'Revise o que foi entregue e confirme ou peça um ajuste em poucos minutos.'
                    : 'Você não precisa fazer nada agora. Avisaremos quando uma validação estiver pronta.'}
              </span>
            </div>
          </header>

          {aprovacoes.length ? (
            <div className={styles.listaAprovacoes}>
              {aprovacoes.map((tarefa) => (
                <AprovacaoCliente
                  key={tarefa.id}
                  codigo={codigo}
                  tarefa={tarefa}
                  aceiteFinal={tarefa.id === ultimaTarefa?.id && projeto.feitas === projeto.total}
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

        <PosEntregaPortal codigo={codigo} projeto={projeto} concluido={concluido} />

        <section className={styles.seguranca}>
          <LockKeyhole size={16} aria-hidden="true" />
          <div>
            <strong>Um portal, somente o necessário.</strong>
            <p>Notas internas, CRM e evidências de trabalho não aparecem neste link.</p>
          </div>
        </section>
      </div>

      <footer className={styles.rodape}>
        <SubidoLogo size={16} />
        <span>Projeto conduzido com transparência, evidência e aprovação humana.</span>
      </footer>
    </main>
  );
}

function PosEntregaPortal({
  codigo,
  projeto,
  concluido,
}: {
  codigo: string;
  projeto: ProjetoPortalCliente;
  concluido: boolean;
}) {
  return (
    <div className={styles.posEntrega} data-concluido={concluido || undefined}>
      <section className={styles.arquivos} aria-labelledby="arquivos-titulo">
        <header>
          <div>
            <p>{concluido ? 'Kit final do projeto' : 'Materiais liberados'}</p>
            <h2 id="arquivos-titulo">
              {concluido ? 'Tudo que fica com você.' : 'Arquivos do projeto'}
            </h2>
          </div>
          <span>
            <ShieldCheck size={14} /> Versões aprovadas para você
          </span>
        </header>

        {projeto.arquivos.length ? (
          <ol>
            {projeto.arquivos.map((arquivo) => {
              const tarefa = projeto.tarefas.find((item) => item.id === arquivo.tarefaId);
              return (
                <li key={arquivo.id}>
                  <span className={styles.iconeArquivo}>
                    <Files size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <small>
                      {rotuloArquivo(arquivo.mimeType)} · versão {arquivo.versao}
                    </small>
                    <strong>{arquivo.titulo}</strong>
                    {arquivo.descricao && <p>{arquivo.descricao}</p>}
                    <em>
                      {formatarTamanho(arquivo.tamanhoBytes)} ·{' '}
                      {tarefa ? `${tarefa.faseTitulo} · ${tarefa.titulo}` : 'Projeto geral'}
                    </em>
                  </div>
                  <a href={`/portal/${codigo}/arquivos/${arquivo.id}`}>
                    <Download size={15} /> Baixar
                  </a>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className={styles.vazioArquivo}>
            <Files size={20} aria-hidden="true" />
            <p>Os arquivos liberados para download aparecerão aqui.</p>
          </div>
        )}
      </section>

      <section className={styles.linhaTempo} aria-labelledby="linha-tempo-titulo">
        <header>
          <div>
            <p>Linha do tempo</p>
            <h2 id="linha-tempo-titulo">O que foi decidido.</h2>
          </div>
          <span>
            <History size={14} /> Histórico compartilhado
          </span>
        </header>

        {projeto.eventos.length ? (
          <ol>
            {projeto.eventos.slice(0, 8).map((evento) => {
              const tarefa = projeto.tarefas.find((item) => item.id === evento.tarefaId);
              return (
                <li key={evento.id} data-cliente={evento.autor === 'cliente' || undefined}>
                  <span className={styles.iconeEvento}>
                    <IconeEvento tipo={evento.tipo} />
                  </span>
                  <div>
                    <strong>{ROTULO_EVENTO[evento.tipo]}</strong>
                    <small>{tarefa?.titulo ?? 'Projeto geral'}</small>
                    {evento.comentario && <p>{evento.comentario}</p>}
                  </div>
                  <time dateTime={evento.criadoEm}>{formatarMomento(evento.criadoEm)}</time>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className={styles.vazioArquivo}>
            <History size={20} aria-hidden="true" />
            <p>Validações e aprovações aparecerão aqui automaticamente.</p>
          </div>
        )}
      </section>
    </div>
  );
}

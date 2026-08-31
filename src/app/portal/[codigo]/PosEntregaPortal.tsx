import {
  BadgeCheck,
  Check,
  Download,
  FileCheck2,
  FileUp,
  Files,
  History,
  MessageSquareText,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { EventoPortalCliente, ProjetoPortalCliente } from '@/lib/portal-cliente/servico';
import styles from './portal.module.css';

const ROTULO_EVENTO: Record<EventoPortalCliente['tipo'], string> = {
  aprovacao_solicitada: 'Entrega pronta para sua revisão',
  entrega_aprovada: 'Entrega aprovada por você',
  ajustes_solicitados: 'Ajuste solicitado',
  arquivo_liberado: 'Novo arquivo disponível',
  pendencia_concluida: 'Pendência confirmada pelo cliente',
  mudanca_escopo_solicitada: 'Mudança solicitada pelo cliente',
  mudanca_escopo_incluida: 'Mudança confirmada no combinado',
  mudanca_escopo_proposta: 'Impacto enviado para decisão',
  mudanca_escopo_aprovada: 'Mudança aprovada pelo cliente',
  mudanca_escopo_recusada: 'Combinado original mantido',
  encerramento_enviado: 'Encerramento enviado para aceite',
  projeto_encerrado: 'Projeto encerrado com aceite',
};

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
  if (tipo === 'entrega_aprovada' || tipo === 'projeto_encerrado') {
    return <BadgeCheck size={17} aria-hidden="true" />;
  }
  if (tipo === 'ajustes_solicitados') return <MessageSquareText size={17} aria-hidden="true" />;
  if (tipo === 'arquivo_liberado') return <FileUp size={17} aria-hidden="true" />;
  if (tipo === 'pendencia_concluida') return <Check size={17} aria-hidden="true" />;
  if (tipo.startsWith('mudanca_escopo')) return <FileCheck2 size={17} aria-hidden="true" />;
  return <Send size={17} aria-hidden="true" />;
}

export function PosEntregaPortal({
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
              const mudanca = projeto.mudancasEscopo.find(
                (item) => item.id === evento.mudancaEscopoId,
              );
              return (
                <li key={evento.id} data-cliente={evento.autor === 'cliente' || undefined}>
                  <span className={styles.iconeEvento}>
                    <IconeEvento tipo={evento.tipo} />
                  </span>
                  <div>
                    <strong>{ROTULO_EVENTO[evento.tipo]}</strong>
                    <small>{tarefa?.titulo ?? mudanca?.titulo ?? 'Projeto geral'}</small>
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

import {
  ChevronDown,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
  FolderOpen,
  Headphones,
} from 'lucide-react';
import type { ArquivoPortalCliente, ProjetoPortalCliente } from '@/lib/portal-cliente/tipos';
import styles from './MateriaisPortal.module.css';
import layout from './PortalProjeto.module.css';

function tipoArquivo(mime: string) {
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv')
    return { rotulo: 'Planilha', icone: <FileSpreadsheet size={24} /> };
  if (mime.startsWith('image/')) return { rotulo: 'Imagem', icone: <FileImage size={24} /> };
  if (mime.startsWith('video/')) return { rotulo: 'Vídeo', icone: <Film size={24} /> };
  if (mime.startsWith('audio/')) return { rotulo: 'Áudio', icone: <Headphones size={24} /> };
  return {
    rotulo: mime === 'application/pdf' ? 'PDF' : mime.includes('zip') ? 'Pacote' : 'Documento',
    icone: <FileText size={24} />,
  };
}

function Arquivo({
  codigo,
  arquivo,
  projeto,
}: {
  codigo: string;
  arquivo: ArquivoPortalCliente;
  projeto: ProjetoPortalCliente;
}) {
  const tipo = tipoArquivo(arquivo.mimeType);
  const tamanho =
    arquivo.tamanhoBytes < 1024 * 1024
      ? `${Math.max(1, Math.round(arquivo.tamanhoBytes / 1024))} KB`
      : `${(arquivo.tamanhoBytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
  const tarefa = projeto.tarefas.find((item) => item.id === arquivo.tarefaId);
  return (
    <li className={styles.arquivo}>
      <div className={styles.arquivoTopo}>
        <span aria-hidden="true">{tipo.icone}</span>
        <span>
          {tipo.rotulo} · {tamanho}
          <span className={styles.versao}>Versão {arquivo.versao}</span>
        </span>
      </div>
      <h3>{arquivo.titulo}</h3>
      <div className={styles.arquivoRodape}>
        <a
          href={`/portal/${codigo}/arquivos/${arquivo.id}`}
          aria-label={`Baixar ${arquivo.titulo}, versão ${arquivo.versao}`}
        >
          <Download size={17} aria-hidden="true" /> Baixar
        </a>
        {(arquivo.descricao || tarefa) && (
          <details className={styles.detalheArquivo}>
            <summary aria-label={`Detalhes de ${arquivo.titulo}`}>
              Detalhes <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div>
              {arquivo.descricao && <p>{arquivo.descricao}</p>}
              {tarefa && <span>Entrega: {tarefa.titulo}</span>}
            </div>
          </details>
        )}
      </div>
    </li>
  );
}

export function ArquivosPortal({
  codigo,
  projeto,
}: {
  codigo: string;
  projeto: ProjetoPortalCliente;
}) {
  return (
    <section className={styles.arquivos} aria-labelledby="arquivos-titulo">
      <header className={layout.tituloSecao}>
        <h2 id="arquivos-titulo" tabIndex={-1}>
          Arquivos do projeto
        </h2>
        <span>{projeto.arquivos.length}</span>
      </header>
      {projeto.arquivos.length ? (
        <>
          <ul className={styles.gradeArquivos}>
            {projeto.arquivos.slice(0, 4).map((arquivo) => (
              <Arquivo key={arquivo.id} codigo={codigo} arquivo={arquivo} projeto={projeto} />
            ))}
          </ul>
          {projeto.arquivos.length > 4 && (
            <details className={layout.mais}>
              <summary>
                Ver mais {projeto.arquivos.length - 4}{' '}
                {projeto.arquivos.length === 5 ? 'arquivo' : 'arquivos'}{' '}
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <ul className={styles.gradeArquivos}>
                {projeto.arquivos.slice(4).map((arquivo) => (
                  <Arquivo key={arquivo.id} codigo={codigo} arquivo={arquivo} projeto={projeto} />
                ))}
              </ul>
            </details>
          )}
        </>
      ) : (
        <div className={styles.vazio}>
          <FolderOpen size={26} aria-hidden="true" />
          <div>
            <strong>Nenhum arquivo liberado</strong>
            <p>Os materiais aparecerão aqui quando o profissional compartilhar.</p>
          </div>
        </div>
      )}
    </section>
  );
}

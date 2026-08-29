import {
  Download,
  Eye,
  EyeOff,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
  History,
  Music,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  ArquivoProjetoExecucao,
  TarefaProjetoExecucao,
} from '@/lib/projetos-execucao/queries';
import styles from './CentralArquivos.module.css';

export type GrupoArquivo = {
  id: string;
  titulo: string;
  tarefaId: string | null;
  versoes: ArquivoProjetoExecucao[];
};

export function agruparArquivos(arquivos: ArquivoProjetoExecucao[]): GrupoArquivo[] {
  const mapa = new Map<string, ArquivoProjetoExecucao[]>();
  for (const arquivo of arquivos) {
    const grupo = mapa.get(arquivo.grupoId) ?? [];
    grupo.push(arquivo);
    mapa.set(arquivo.grupoId, grupo);
  }
  return [...mapa.entries()]
    .map(([id, versoes]) => {
      versoes.sort((a, b) => b.versao - a.versao);
      const atual = versoes[0]!;
      return { id, titulo: atual.titulo, tarefaId: atual.tarefaId, versoes };
    })
    .sort((a, b) => b.versoes[0]!.criadoEm.localeCompare(a.versoes[0]!.criadoEm));
}

export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
    .format(new Date(valor))
    .replace('.', '');
}

function tipoArquivo(mime: string): { rotulo: string; Icone: typeof File } {
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') {
    return { rotulo: 'Planilha', Icone: FileSpreadsheet };
  }
  if (mime.startsWith('image/')) return { rotulo: 'Imagem', Icone: FileImage };
  if (mime.startsWith('video/')) return { rotulo: 'Vídeo', Icone: Film };
  if (mime.startsWith('audio/')) return { rotulo: 'Áudio', Icone: Music };
  if (mime.includes('zip')) return { rotulo: 'Pacote', Icone: Package };
  if (mime.includes('pdf') || mime.includes('word') || mime.startsWith('text/')) {
    return { rotulo: 'Documento', Icone: FileText };
  }
  return { rotulo: 'Arquivo', Icone: File };
}

export function GrupoArquivoCard({
  grupo,
  tarefas,
  projetoId,
  operando,
  onNovaVersao,
  onVisibilidade,
  onExcluir,
}: {
  grupo: GrupoArquivo;
  tarefas: TarefaProjetoExecucao[];
  projetoId: string;
  operando: boolean;
  onNovaVersao: (grupo: GrupoArquivo) => void;
  onVisibilidade: (arquivo: ArquivoProjetoExecucao) => void;
  onExcluir: (arquivo: ArquivoProjetoExecucao) => void;
}) {
  const atual = grupo.versoes[0]!;
  const publicada = grupo.versoes.find((item) => item.visivelCliente) ?? null;
  const tarefa = tarefas.find((item) => item.id === atual.tarefaId) ?? null;
  const { rotulo, Icone } = tipoArquivo(atual.mimeType);

  return (
    <article className={styles.grupo} data-publicado={publicada ? true : undefined}>
      <header>
        <span className={styles.tipoIcone}>
          <Icone size={19} aria-hidden="true" />
        </span>
        <div>
          <small>
            {rotulo} · versão {atual.versao}
          </small>
          <h4>{grupo.titulo}</h4>
          {atual.descricao && <p>{atual.descricao}</p>}
        </div>
        <span className={styles.estadoPortal} data-ativo={publicada ? true : undefined}>
          {publicada ? <Eye size={13} /> : <EyeOff size={13} />}
          {publicada ? `v${publicada.versao} no portal` : 'Somente interno'}
        </span>
      </header>

      <div className={styles.contextoArquivo}>
        <span>{tarefa ? `${tarefa.faseTitulo} · ${tarefa.titulo}` : 'Projeto geral'}</span>
        <span>{grupo.versoes.length === 1 ? '1 versão' : `${grupo.versoes.length} versões`}</span>
        <button type="button" onClick={() => onNovaVersao(grupo)}>
          <Plus size={14} /> Nova versão
        </button>
      </div>

      <ol className={styles.versoes}>
        {grupo.versoes.map((item) => (
          <li key={item.id} data-visivel={item.visivelCliente || undefined}>
            <span className={styles.numeroVersao}>v{item.versao}</span>
            <div>
              <strong>{item.nomeOriginal}</strong>
              <small>
                {formatarTamanhoArquivo(item.tamanhoBytes)} · {formatarData(item.criadoEm)}
              </small>
            </div>
            {item.visivelCliente && <em>Cliente</em>}
            <div className={styles.acoesVersao}>
              <a
                href={`/api/projetos/arquivos/${item.id}?projeto=${projetoId}`}
                aria-label={`Baixar versão ${item.versao} de ${item.titulo}`}
              >
                <Download size={15} />
              </a>
              <button
                type="button"
                onClick={() => onVisibilidade(item)}
                disabled={operando}
                aria-label={item.visivelCliente ? 'Retirar do portal' : 'Liberar no portal'}
              >
                {item.visivelCliente ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                type="button"
                onClick={() => onExcluir(item)}
                disabled={operando || item.visivelCliente}
                aria-label={`Excluir versão ${item.versao}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {grupo.versoes.length > 1 && (
        <footer>
          <History size={14} /> O histórico preserva o que foi apresentado em cada etapa.
        </footer>
      )}
    </article>
  );
}

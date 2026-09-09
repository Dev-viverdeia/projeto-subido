import { ChartNoAxesCombined, FolderOpen, Play, UsersRound } from 'lucide-react';
import styles from './SalaEntrega.module.css';

export type PainelSala = 'execucao' | 'arquivos' | 'cliente' | 'evolucao';

export function NavegacaoSalaEntrega({
  painel,
  concluido,
  evolucaoRegistrada,
  recorrente = false,
  mostrarEvolucao = concluido,
  proximaTarefa,
  totalArquivos,
  rotuloCliente,
  onChange,
}: {
  painel: PainelSala;
  concluido: boolean;
  evolucaoRegistrada: boolean;
  recorrente?: boolean;
  mostrarEvolucao?: boolean;
  proximaTarefa: string | null;
  totalArquivos: number;
  rotuloCliente: string;
  onChange: (painel: PainelSala) => void;
}) {
  return (
    <nav
      className={styles.paineis}
      aria-label="Áreas da entrega"
      data-evolucao={mostrarEvolucao || undefined}
    >
      {mostrarEvolucao && (
        <button
          type="button"
          data-ativo={painel === 'evolucao' || undefined}
          aria-current={painel === 'evolucao' ? 'page' : undefined}
          onClick={() => onChange('evolucao')}
        >
          <ChartNoAxesCombined size={17} aria-hidden="true" />
          <span>
            <strong>{recorrente ? 'Acompanhamento' : 'Evolução'}</strong>
            <small>
              {recorrente
                ? 'Próximas ações'
                : evolucaoRegistrada
                  ? 'Resultado confirmado'
                  : 'Revisão pós-entrega'}
            </small>
          </span>
        </button>
      )}
      <button
        type="button"
        data-ativo={painel === 'execucao' || undefined}
        aria-current={painel === 'execucao' ? 'page' : undefined}
        onClick={() => onChange('execucao')}
      >
        <Play size={17} aria-hidden="true" />
        <span>
          <strong>Trabalho</strong>
          <small>{concluido ? 'Entrega encerrada' : (proximaTarefa ?? 'Aceite final')}</small>
        </span>
      </button>
      <button
        type="button"
        data-ativo={painel === 'arquivos' || undefined}
        aria-current={painel === 'arquivos' ? 'page' : undefined}
        onClick={() => onChange('arquivos')}
      >
        <FolderOpen size={17} aria-hidden="true" />
        <span>
          <strong>Arquivos</strong>
          <small>
            {totalArquivos} {totalArquivos === 1 ? 'arquivo' : 'arquivos'}
          </small>
        </span>
      </button>
      <button
        type="button"
        data-ativo={painel === 'cliente' || undefined}
        aria-current={painel === 'cliente' ? 'page' : undefined}
        onClick={() => onChange('cliente')}
      >
        <UsersRound size={17} aria-hidden="true" />
        <span>
          <strong>Cliente</strong>
          <small>{rotuloCliente}</small>
        </span>
      </button>
    </nav>
  );
}

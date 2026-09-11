import { ChartNoAxesCombined, FolderOpen, ListTodo, Repeat2, UsersRound } from 'lucide-react';
import styles from './NavegacaoSalaEntrega.module.css';

export type PainelSala = 'execucao' | 'arquivos' | 'cliente' | 'evolucao';

export function NavegacaoSalaEntrega({
  painel,
  concluido,
  recorrente = false,
  mostrarEvolucao = concluido,
  totalArquivos,
  pendenciasCliente,
  onChange,
}: {
  painel: PainelSala;
  concluido: boolean;
  recorrente?: boolean;
  mostrarEvolucao?: boolean;
  totalArquivos: number;
  pendenciasCliente: number;
  onChange: (painel: PainelSala) => void;
}) {
  const itens = [
    ...(mostrarEvolucao
      ? [
          {
            id: 'evolucao' as const,
            nome: recorrente ? 'Acompanhar' : 'Evolução',
            Icone: recorrente ? Repeat2 : ChartNoAxesCombined,
            quantidade: 0,
          },
        ]
      : []),
    { id: 'execucao' as const, nome: 'Trabalho', Icone: ListTodo, quantidade: 0 },
    { id: 'cliente' as const, nome: 'Cliente', Icone: UsersRound, quantidade: pendenciasCliente },
    { id: 'arquivos' as const, nome: 'Arquivos', Icone: FolderOpen, quantidade: totalArquivos },
  ];
  return (
    <nav
      className={styles.navegacao}
      aria-label="Áreas da entrega"
      data-evolucao={mostrarEvolucao || undefined}
    >
      {itens.map(({ id, nome, Icone, quantidade }) => (
        <button
          key={id}
          type="button"
          aria-current={painel === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icone size={18} aria-hidden="true" />
          <span>{nome}</span>
          {quantidade > 0 && (
            <span
              className={styles.contagem}
              aria-label={`${quantidade} ${id === 'cliente' ? (quantidade === 1 ? 'pendência com o cliente' : 'pendências com o cliente') : quantidade === 1 ? 'arquivo' : 'arquivos'}`}
            >
              {quantidade}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

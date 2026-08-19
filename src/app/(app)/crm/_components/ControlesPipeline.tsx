'use client';

import { Search, X } from 'lucide-react';
import type { FaseCrm, IdFaseCrm } from '@/lib/crm/etapas';
import styles from './PipelineCrm.module.css';

export type FiltroPipeline = 'todas' | 'atencao' | 'sem_acao' | 'proposta';
export type FaseAtiva = Exclude<IdFaseCrm, 'desfecho'>;

type Contagens = Record<FiltroPipeline, number>;

export function BarraPrioridades({
  contagens,
  filtro,
  busca,
  aoSelecionarFiltro,
  aoBuscar,
}: {
  contagens: Contagens;
  filtro: FiltroPipeline;
  busca: string;
  aoSelecionarFiltro: (filtro: FiltroPipeline) => void;
  aoBuscar: (busca: string) => void;
}) {
  return (
    <section className={styles.barraPrioridades} aria-labelledby="foco-crm-titulo">
      <div className={styles.leituraPrioridade}>
        <span>Seu foco agora</span>
        <strong id="foco-crm-titulo">
          {contagens.atencao === 0
            ? 'As próximas ações estão em dia'
            : `${contagens.atencao} ${contagens.atencao === 1 ? 'oportunidade precisa' : 'oportunidades precisam'} de ação`}
        </strong>
        <small>A próxima ação mantém cada venda em andamento.</small>
      </div>

      <div className={styles.controlesPipeline}>
        <div className={styles.filtros} aria-label="Filtrar oportunidades">
          {(
            [
              ['todas', 'Todas'],
              ['atencao', 'Precisam de ação'],
              ['sem_acao', 'Sem próxima ação'],
              ['proposta', 'Com proposta'],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              type="button"
              key={id}
              aria-pressed={filtro === id}
              aria-label={`${rotulo}: ${contagens[id]}`}
              onClick={() => aoSelecionarFiltro(id)}
            >
              <span>{rotulo}</span>
              <strong>{contagens[id]}</strong>
            </button>
          ))}
        </div>

        <label className={styles.busca}>
          <Search size={16} strokeWidth={1.8} aria-hidden="true" />
          <span className={styles.rotuloOculto}>Buscar oportunidades</span>
          <input
            type="search"
            value={busca}
            onChange={(evento) => aoBuscar(evento.target.value)}
            placeholder="Buscar empresa ou contato"
          />
          {busca && (
            <button type="button" onClick={() => aoBuscar('')} aria-label="Limpar busca">
              <X size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
        </label>
      </div>
    </section>
  );
}

export function AbasPipelineMobile({
  fases,
  faseAtiva,
  contagem,
  aoSelecionar,
}: {
  fases: ReadonlyArray<FaseCrm>;
  faseAtiva: FaseAtiva;
  contagem: (fase: IdFaseCrm) => number;
  aoSelecionar: (fase: FaseAtiva) => void;
}) {
  return (
    <div className={styles.abasMobile} role="tablist" aria-label="Etapas da venda">
      {fases.map((fase) => (
        <button
          type="button"
          role="tab"
          key={fase.id}
          aria-selected={faseAtiva === fase.id}
          aria-label={`${fase.rotulo}: ${contagem(fase.id)}`}
          onClick={() => aoSelecionar(fase.id as FaseAtiva)}
        >
          <span>{fase.rotulo}</span>
          <strong>{contagem(fase.id)}</strong>
        </button>
      ))}
    </div>
  );
}

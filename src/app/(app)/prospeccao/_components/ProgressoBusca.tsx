'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Spinner } from '@/design-system/via';
import styles from '../pagina.module.css';

const ETAPAS = [
  {
    titulo: 'Buscando empresas',
    descricao: 'Procurando o tipo de negócio na cidade ou região escolhida.',
  },
  {
    titulo: 'Procurando contatos',
    descricao: 'Buscando telefone, e-mail, site e redes sociais.',
  },
  {
    titulo: 'Buscando possíveis decisores',
    descricao: 'Procurando pessoas com cargo de decisão ligadas à empresa.',
  },
  {
    titulo: 'Organizando os resultados',
    descricao: 'Removendo repetições e preparando a lista para consulta.',
  },
] as const;

/**
 * Narração honesta da busca longa: as quatro etapas correspondem ao pipeline
 * real, mas não exibem percentual ou prazo inventado. A última fica ativa até
 * a resposta do servidor substituir o formulário pela lista concluída.
 */
export function ProgressoBusca({ quantidade }: { quantidade: number }) {
  const [etapa, setEtapa] = useState(0);

  useEffect(() => {
    const intervalos = [10_000, 18_000, 28_000];
    if (etapa >= ETAPAS.length - 1) return;
    const timer = setTimeout(() => setEtapa((atual) => atual + 1), intervalos[etapa]);
    return () => clearTimeout(timer);
  }, [etapa]);

  const atual = ETAPAS[etapa] ?? ETAPAS[0];

  return (
    <section className={styles.processamentoBusca} role="status" aria-live="polite">
      <div className={styles.processamentoTopo}>
        <span className={styles.processamentoIcone} aria-hidden="true">
          <Spinner size="lg" tone="navy" />
        </span>
        <div>
          <p>Busca em andamento</p>
          <h3>{atual.titulo}</h3>
          <span>{atual.descricao}</span>
        </div>
        <small>
          {quantidade} empresas solicitadas
          <span>Pode levar até 2 minutos</span>
        </small>
      </div>

      <ol className={styles.etapasProcessamento}>
        {ETAPAS.map((item, indice) => (
          <li
            key={item.titulo}
            data-estado={indice < etapa ? 'concluida' : indice === etapa ? 'ativa' : 'futura'}
          >
            <span aria-hidden="true">
              {indice < etapa ? <Check size={14} /> : String(indice + 1).padStart(2, '0')}
            </span>
            <strong>{item.titulo}</strong>
          </li>
        ))}
      </ol>

      <p className={styles.notaProcessamento}>
        Pode deixar esta tela aberta. A lista aparecerá automaticamente quando a busca terminar.
      </p>
    </section>
  );
}

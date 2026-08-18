'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Spinner } from '@/design-system/via';
import styles from '../pagina.module.css';

const ETAPAS = [
  {
    titulo: 'Localizando empresas',
    descricao: 'Cruzando o tipo de negócio com a cidade ou região escolhida.',
  },
  {
    titulo: 'Validando canais públicos',
    descricao: 'Reunindo telefone, e-mail, site e presença nas redes sociais.',
  },
  {
    titulo: 'Buscando possíveis decisores',
    descricao: 'Procurando lideranças associadas publicamente a cada empresa.',
  },
  {
    titulo: 'Organizando os dossiês',
    descricao: 'Consolidando as evidências para você comparar os resultados.',
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
          <p>Lista em construção</p>
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
        Você pode continuar nesta tela. A lista aparece automaticamente assim que a qualificação
        terminar.
      </p>
    </section>
  );
}

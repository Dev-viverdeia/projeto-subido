'use client';

import { useState } from 'react';
import { ArrowDown, ArrowRight, CheckCheck, Cpu, Inbox } from 'lucide-react';
import type { VisaoVisualProjeto } from '@/lib/projetos/visao-visual';
import styles from './VisaoProjeto.module.css';

export function FluxoProjeto({
  visao,
  compacto = false,
}: {
  visao: VisaoVisualProjeto;
  compacto?: boolean;
}) {
  const [selecionado, selecionar] = useState(0);
  const movimentos = [
    { ...visao.entrada, rotulo: 'Entrada', icone: <Inbox size={22} /> },
    { ...visao.processamento, rotulo: 'Com IA', icone: <Cpu size={22} /> },
    { ...visao.entrega, rotulo: 'Entrega', icone: <CheckCheck size={22} /> },
  ];

  if (compacto) {
    return (
      <ol className={styles.miniFluxo} aria-label="Como funciona">
        {movimentos.map((movimento, indice) => (
          <li key={movimento.rotulo}>
            <span className={styles.miniIcone} aria-hidden="true">
              {movimento.icone}
            </span>
            <span>{movimento.titulo}</span>
            {indice < 2 ? (
              <ArrowRight className={styles.conectorMini} size={16} aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <section className={styles.fluxo} aria-labelledby="fluxo-projeto-titulo">
      <header className={styles.tituloSecao}>
        <h2 id="fluxo-projeto-titulo">Como funciona</h2>
        <span>Explore o fluxo</span>
      </header>
      <ol className={styles.movimentos}>
        {movimentos.map((movimento, indice) => (
          <li key={movimento.rotulo}>
            <button
              type="button"
              aria-pressed={selecionado === indice}
              onClick={() => selecionar(indice)}
            >
              <span className={styles.iconeMovimento} aria-hidden="true">
                {movimento.icone}
              </span>
              <span className={styles.textoMovimento}>
                <small>{movimento.rotulo}</small>
                <strong>{movimento.titulo}</strong>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            {indice < 2 ? (
              <ArrowDown className={styles.conector} size={16} aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
      <div className={styles.exemplo} aria-live="polite" aria-atomic="true">
        <span>Exemplo de uso</span>
        <strong>{movimentos[selecionado]!.exemplo}</strong>
        <p>{movimentos[selecionado]!.descricao}</p>
      </div>
    </section>
  );
}

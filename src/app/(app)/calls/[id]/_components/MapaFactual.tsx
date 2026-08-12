import { BadgeCheck, ChevronRight, CircleAlert, ListChecks, Target } from 'lucide-react';
import type { PosCall } from '@/lib/calls/queries';
import styles from '../pagina.module.css';

export function ListaFactual({
  itens,
  vazio,
  variante,
}: {
  itens: string[];
  vazio: string;
  variante?: 'decisao' | 'alerta';
}) {
  if (!itens.length) return <p className={styles.listaVazia}>{vazio}</p>;
  return (
    <ul className={styles.listaFactual} data-variante={variante}>
      {itens.map((item, indice) => (
        <li key={`${item}-${indice}`}>
          <span aria-hidden="true">{String(indice + 1).padStart(2, '0')}</span>
          <p>{item}</p>
        </li>
      ))}
    </ul>
  );
}

export function MapaFactual({
  analise,
  temAnalise,
}: {
  analise: PosCall['analise'];
  temAnalise: boolean;
}) {
  const totalFatos = analise
    ? analise.dores.length +
      analise.decisoes.length +
      analise.compromissos.length +
      analise.objecoes.length
    : 0;

  return (
    <details className={styles.mapaFactual}>
      <summary>
        <div>
          <p>Detalhes da análise</p>
          <h2>Rever fatos da conversa</h2>
        </div>
        <span>
          {temAnalise ? `${totalFatos} fatos` : 'Aguardando leitura'}
          <ChevronRight size={17} aria-hidden="true" />
        </span>
      </summary>

      <div className={styles.gradeFatos}>
        <article className={styles.cartaoFato}>
          <header>
            <span className={styles.iconeFato} data-tipo="dor">
              <Target size={17} aria-hidden="true" />
            </span>
            <div>
              <p>O que foi dito</p>
              <h3>Dores percebidas</h3>
            </div>
            <strong>{analise?.dores.length ?? 0}</strong>
          </header>
          <ListaFactual
            itens={analise?.dores ?? []}
            vazio="Nenhuma dor ficou explícita o suficiente para ser tratada como fato."
          />
        </article>

        <article className={styles.cartaoFato}>
          <header>
            <span className={styles.iconeFato} data-tipo="decisao">
              <BadgeCheck size={17} aria-hidden="true" />
            </span>
            <div>
              <p>O que avançou</p>
              <h3>Decisões confirmadas</h3>
            </div>
            <strong>{analise?.decisoes.length ?? 0}</strong>
          </header>
          <ListaFactual
            itens={analise?.decisoes ?? []}
            vazio="Nenhuma decisão explícita foi confirmada nesta conversa."
            variante="decisao"
          />
        </article>

        <article className={styles.cartaoFato}>
          <header>
            <span className={styles.iconeFato} data-tipo="compromisso">
              <ListChecks size={17} aria-hidden="true" />
            </span>
            <div>
              <p>Quem ficou responsável</p>
              <h3>Compromissos</h3>
            </div>
            <strong>{analise?.compromissos.length ?? 0}</strong>
          </header>
          <ListaFactual
            itens={analise?.compromissos ?? []}
            vazio="Não houve compromisso com responsável claramente identificado."
            variante="decisao"
          />
        </article>

        <article className={styles.cartaoFato}>
          <header>
            <span className={styles.iconeFato} data-tipo="objecao">
              <CircleAlert size={17} aria-hidden="true" />
            </span>
            <div>
              <p>O que pode travar</p>
              <h3>Objeções explícitas</h3>
            </div>
            <strong>{analise?.objecoes.length ?? 0}</strong>
          </header>
          <ListaFactual
            itens={analise?.objecoes ?? []}
            vazio="Nenhuma objeção explícita foi identificada na transcrição."
            variante="alerta"
          />
        </article>
      </div>
    </details>
  );
}

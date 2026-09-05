'use client';

import Link from 'next/link';
import { BookOpen, Bot, Code2, Layers, MessageSquare } from 'lucide-react';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import {
  contarConcluidas,
  estadoDoProgresso,
  percentual,
  useProgresso,
} from '@/lib/progresso/local';
import { PillEstado } from '../../_components/PillEstado';
import styles from './CartaoFormacao.module.css';

type Props = {
  formacao: FormacaoResumo;
  recomendada?: boolean;
  etapa: string;
  foco: string;
};

function rotuloAcao(feitas: number, total: number) {
  if (total === 0) return 'Ver formação';
  if (total > 0 && feitas >= total) return 'Revisar formação';
  if (feitas > 0) return 'Retomar formação';
  return 'Começar formação';
}

function Seta() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONES: Record<string, typeof BookOpen> = {
  'formacao-de-chatgpt': MessageSquare,
  'formacao-de-gpt-agents': Bot,
  'formacao-de-lovable': Layers,
  'formacao-de-claude-code': Code2,
};

export function CartaoFormacao({ formacao, recomendada = false, etapa, foco }: Props) {
  const progresso = useProgresso();
  const feitas = contarConcluidas(progresso, formacao.aulaIds);
  const pct = percentual(feitas, formacao.aulas);
  const estado = estadoDoProgresso(feitas, formacao.aulas);
  const Icone = ICONES[formacao.slug] ?? BookOpen;

  return (
    <Link
      href={`/formacoes/${formacao.slug}`}
      className={styles.cartao}
      data-estado={estado}
      data-recomendada={recomendada || undefined}
    >
      <div className={styles.topo}>
        <span className={styles.capa} aria-hidden="true">
          {formacao.capa_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem publicada no Storage, sem domínio estável para next/image
            <img src={formacao.capa_url} alt="" loading="lazy" />
          ) : (
            <Icone size={24} strokeWidth={1.6} />
          )}
        </span>
        {estado === 'concluida' || estado === 'em-andamento' ? (
          <PillEstado estado={estado} className={styles.estado} />
        ) : recomendada ? (
          <span className={styles.recomendada}>Comece aqui</span>
        ) : (
          <span className={styles.etapa}>{etapa}</span>
        )}
      </div>

      <div className={styles.corpo}>
        <div className={styles.conteudo}>
          <h3>{formacao.titulo}</h3>
          <p>{foco}</p>
        </div>

        <div className={styles.rodape}>
          <div className={styles.progresso}>
            <div className={styles.progressoTexto}>
              <span>
                {feitas > 0
                  ? `${feitas} de ${formacao.aulas} aulas concluídas`
                  : `${formacao.aulas} ${formacao.aulas === 1 ? 'aula' : 'aulas'} · ${formacao.modulos} ${formacao.modulos === 1 ? 'módulo' : 'módulos'}`}
              </span>
            </div>
            {feitas > 0 && (
              <div className={styles.trilho} aria-hidden="true">
                <span style={{ transform: `scaleX(${pct / 100})` }} />
              </div>
            )}
          </div>
        </div>
      </div>
      <span className={styles.acao}>
        {rotuloAcao(feitas, formacao.aulas)}
        <span className={styles.seta}>
          <Seta />
        </span>
      </span>
    </Link>
  );
}

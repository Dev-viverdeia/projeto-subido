'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  contarConcluidas,
  contarEtapasFeitas,
  estadoDoProgresso,
  useProgresso,
} from '@/lib/progresso/local';
import styles from './MapaPlataforma.module.css';

/**
 * O MAPA da plataforma: um tile por destino, cada um com o SEU número real —
 * é o "levar para as telas" com um motivo para ir, não uma grade de ícones.
 *
 * Número é protagonista (mono, tabular): aulas e etapas vêm do progresso
 * local deste navegador; projetos, conversas e a próxima mentoria vêm do
 * servidor via RLS. Nenhum número decorativo — quando não há nada, o tile
 * diz zero ou um traço, e continua levando para a tela.
 */
export function MapaPlataforma({
  totalSolucoes,
  totalFormacoes,
  aulaIdsPorFormacao,
  etapaIdsPorSolucao,
  projetosBuilder,
  conversasConsultor,
  proximaMentoria,
}: {
  totalSolucoes: number;
  totalFormacoes: number;
  /** Agrupados por conteúdo — é o agrupamento que permite contar CONCLUÍDOS. */
  aulaIdsPorFormacao: string[][];
  etapaIdsPorSolucao: string[][];
  projetosBuilder: number;
  conversasConsultor: number;
  /** Já formatada no servidor ("HOJE · 19:00") — null sem sessão futura. */
  proximaMentoria: string | null;
}) {
  const progresso = useProgresso();

  const todasAulas = aulaIdsPorFormacao.flat();
  const todasEtapas = etapaIdsPorSolucao.flat();
  const aulasFeitas = contarConcluidas(progresso, todasAulas);
  const etapasFeitas = contarEtapasFeitas(progresso, todasEtapas);

  const certificados =
    aulaIdsPorFormacao.filter(
      (ids) => estadoDoProgresso(contarConcluidas(progresso, ids), ids.length) === 'concluida',
    ).length +
    etapaIdsPorSolucao.filter(
      (ids) => estadoDoProgresso(contarEtapasFeitas(progresso, ids), ids.length) === 'concluida',
    ).length;

  const tiles = [
    {
      href: '/formacoes' as const,
      rotulo: 'Formações',
      numero: String(aulasFeitas),
      de: `/${todasAulas.length}`,
      sub: `aulas concluídas · ${totalFormacoes} trilhas`,
    },
    {
      href: '/solucoes' as const,
      rotulo: 'Soluções de IA',
      numero: String(etapasFeitas),
      de: `/${todasEtapas.length}`,
      sub: `etapas implementadas · ${totalSolucoes} soluções`,
    },
    {
      href: '/builder' as const,
      rotulo: 'Builder',
      numero: String(projetosBuilder),
      de: null,
      sub: projetosBuilder === 1 ? 'projeto formulado' : 'projetos formulados',
    },
    {
      href: '/consultor' as const,
      rotulo: 'Consultor',
      numero: String(conversasConsultor),
      de: null,
      sub: conversasConsultor === 1 ? 'conversa aberta' : 'conversas abertas',
    },
    {
      href: '/mentorias' as const,
      rotulo: 'Mentorias',
      numero: proximaMentoria ?? '—',
      de: null,
      sub: proximaMentoria ? 'próxima sessão' : 'sem sessão marcada',
      compacto: true,
    },
    {
      href: '/certificados' as const,
      rotulo: 'Certificados',
      numero: String(certificados),
      de: null,
      sub: certificados === 1 ? 'conquistado' : 'conquistados',
    },
  ];

  return (
    <nav className={styles.mapa} aria-label="Mapa da plataforma">
      {tiles.map((t) => (
        <Link key={t.href} href={t.href} className={styles.tile}>
          <span className={styles.tileRotulo}>{t.rotulo}</span>
          <span className={styles.tileNumero} data-compacto={t.compacto ? '' : undefined}>
            {t.numero}
            {t.de && <span className={styles.tileDe}>{t.de}</span>}
          </span>
          <span className={styles.tileSub}>{t.sub}</span>
          <span className={styles.tileSeta} aria-hidden="true">
            <ArrowRight size={14} strokeWidth={2} />
          </span>
        </Link>
      ))}
    </nav>
  );
}

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
 * O MAPA da plataforma como LISTA, não grade: seis linhas com hairline entre
 * elas, rótulo à esquerda e o número real em mono à direita. A grade de seis
 * tiles iguais era a assinatura de template que a casa manda evitar — lista
 * com medida lê como índice, e índice é o que isto é.
 *
 * Aulas, etapas e certificados derivam do progresso local; projetos,
 * conversas e a próxima mentoria chegam do servidor via RLS. Nenhum número
 * decorativo.
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

  const linhas = [
    {
      href: '/formacoes' as const,
      rotulo: 'Formações',
      detalhe: `${totalFormacoes} trilhas`,
      valor: `${aulasFeitas}/${todasAulas.length}`,
      unidade: 'aulas',
    },
    {
      href: '/solucoes' as const,
      rotulo: 'Soluções de IA',
      detalhe: `${totalSolucoes} soluções`,
      valor: `${etapasFeitas}/${todasEtapas.length}`,
      unidade: 'etapas',
    },
    {
      href: '/builder' as const,
      rotulo: 'Builder',
      detalhe: 'do problema ao plano',
      valor: String(projetosBuilder),
      unidade: projetosBuilder === 1 ? 'projeto' : 'projetos',
    },
    {
      href: '/consultor' as const,
      rotulo: 'Consultor',
      detalhe: 'indica a solução certa',
      valor: String(conversasConsultor),
      unidade: conversasConsultor === 1 ? 'conversa' : 'conversas',
    },
    {
      href: '/mentorias' as const,
      rotulo: 'Mentorias',
      detalhe: proximaMentoria ? 'próxima sessão' : 'sem sessão marcada',
      valor: proximaMentoria ?? '—',
      unidade: null,
    },
    {
      href: '/certificados' as const,
      rotulo: 'Certificados',
      detalhe: 'formações e soluções',
      valor: String(certificados),
      unidade: certificados === 1 ? 'conquistado' : 'conquistados',
    },
  ];

  return (
    <nav className={styles.mapa} aria-label="Mapa da plataforma">
      <h2 className={styles.eyebrow}>A plataforma</h2>
      <ul className={styles.lista}>
        {linhas.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={styles.linha}>
              <span className={styles.textos}>
                <span className={styles.rotulo}>{l.rotulo}</span>
                <span className={styles.detalhe}>{l.detalhe}</span>
              </span>
              <span className={styles.valorBloco}>
                <span className={styles.valor}>{l.valor}</span>
                {l.unidade && <span className={styles.unidade}>{l.unidade}</span>}
              </span>
              <span className={styles.seta} aria-hidden="true">
                <ArrowRight size={14} strokeWidth={2} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

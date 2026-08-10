'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/design-system/via';
import { useAcoesProgresso, useProgresso } from '@/lib/progresso/local';
import styles from './NavAula.module.css';

/**
 * A barra de navegação da aula: ← Anterior · [Marcar como concluída] · Próxima →.
 * O botão do meio é o ÚNICO sólido da tela — é a ação que importa. Concluir grava
 * na conta e AVANÇA para a próxima; na última aula, apenas conclui.
 *
 * No mobile a barra gruda no rodapé com vidro — o aluno conclui sem rolar de
 * volta. Montar esta barra também "toca" a formação: é o que alimenta o
 * "continue de onde parou" mesmo para quem assiste sem concluir.
 */
export function NavAula({
  formacaoSlug,
  aulaId,
  anteriorId,
  anteriorTitulo,
  proximaId,
  proximaTitulo,
}: {
  formacaoSlug: string;
  aulaId: string;
  anteriorId: string | null;
  anteriorTitulo: string | null;
  proximaId: string | null;
  proximaTitulo: string | null;
}) {
  const router = useRouter();
  const progresso = useProgresso();
  const { concluirAula, tocarFormacao } = useAcoesProgresso();
  const concluida = Boolean(progresso.aulas[aulaId]);

  useEffect(() => {
    tocarFormacao(formacaoSlug);
  }, [formacaoSlug, tocarFormacao]);

  const hrefAula = (id: string) => `/formacoes/${formacaoSlug}/aula/${id}`;

  const concluir = () => {
    concluirAula(aulaId, formacaoSlug);
    if (proximaId) router.push(hrefAula(proximaId));
  };

  return (
    <nav className={styles.barra} aria-label="Navegação da aula">
      {anteriorId ? (
        <Link
          href={hrefAula(anteriorId)}
          className={styles.vizinha}
          data-direcao="anterior"
          aria-label={`Aula anterior: ${anteriorTitulo}`}
        >
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          <span>
            <small>Anterior</small>
            <strong>{anteriorTitulo}</strong>
          </span>
        </Link>
      ) : (
        <span className={styles.limite} aria-hidden="true" />
      )}

      {concluida ? (
        <span className={styles.feita}>
          <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r="8" fill="currentColor" />
            <path
              d="m5.6 9.2 2.2 2.2 4.4-4.8"
              stroke="var(--via-white)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          Aula concluída
        </span>
      ) : (
        <Button variant="primary" onClick={concluir}>
          {proximaId ? 'Concluir e avançar' : 'Concluir formação'}
        </Button>
      )}

      {proximaId ? (
        <Link
          href={hrefAula(proximaId)}
          className={styles.vizinha}
          data-direcao="proxima"
          aria-label={`Próxima aula: ${proximaTitulo}`}
        >
          <span>
            <small>Próxima</small>
            <strong>{proximaTitulo}</strong>
          </span>
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </Link>
      ) : (
        <span className={styles.limite} aria-hidden="true" />
      )}
    </nav>
  );
}

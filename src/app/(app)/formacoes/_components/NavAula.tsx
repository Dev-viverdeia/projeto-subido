'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system/via';
import { concluirAula, tocarFormacao, useProgresso } from '@/lib/progresso/local';
import styles from './NavAula.module.css';

/**
 * A barra de navegação da aula: ← Anterior · [Marcar como concluída] · Próxima →.
 * O botão do meio é o ÚNICO sólido da tela — é a ação que importa. Concluir grava
 * no progresso local e AVANÇA para a próxima; na última aula, apenas conclui.
 *
 * No mobile a barra gruda no rodapé com vidro — o aluno conclui sem rolar de
 * volta. Montar esta barra também "toca" a formação: é o que alimenta o
 * "continue de onde parou" mesmo para quem assiste sem concluir.
 */
export function NavAula({
  formacaoSlug,
  aulaId,
  anteriorId,
  proximaId,
}: {
  formacaoSlug: string;
  aulaId: string;
  anteriorId: string | null;
  proximaId: string | null;
}) {
  const router = useRouter();
  const progresso = useProgresso();
  const concluida = Boolean(progresso.aulas[aulaId]);

  useEffect(() => {
    tocarFormacao(formacaoSlug);
  }, [formacaoSlug]);

  const irPara = (id: string) => router.push(`/formacoes/${formacaoSlug}/aula/${id}`);

  const concluir = () => {
    concluirAula(aulaId, formacaoSlug);
    if (proximaId) irPara(proximaId);
  };

  return (
    <nav className={styles.barra} aria-label="Navegação da aula">
      <Button
        variant="ghost"
        disabled={!anteriorId}
        onClick={() => anteriorId && irPara(anteriorId)}
      >
        ← Anterior
      </Button>

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
          Marcar como concluída
        </Button>
      )}

      <Button variant="ghost" disabled={!proximaId} onClick={() => proximaId && irPara(proximaId)}>
        Próxima →
      </Button>
    </nav>
  );
}

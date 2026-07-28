'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './EstadoGeracao.module.css';

/** ~4 minutos de tentativas. Além disso a geração não voltou mais — e insistir
 *  em silêncio é pior que dizer que parou. */
const TENTATIVAS = 40;
const INTERVALO = 6000;

/**
 * O estado `gerando` visto de FORA da aba que disparou a geração.
 *
 * Quem clicou em "Gerar" vê o cronômetro da própria `Entrevista`. Esta tela é o
 * outro caso: recarregou, voltou depois, abriu em outro dispositivo. O status no
 * banco é a única fonte, então a página se re-renderiza sozinha até ele mudar.
 *
 * `router.refresh()` e não polling de API: o RSC já lê o status, e refazer a
 * renderização do servidor é a mesma consulta que a página faria de qualquer
 * jeito — sem endpoint novo e sem estado duplicado no cliente.
 */
export function EstadoGeracao() {
  const router = useRouter();
  const [tentativas, setTentativas] = useState(0);
  const desistiu = tentativas >= TENTATIVAS;

  useEffect(() => {
    if (desistiu) return;
    const timer = setTimeout(() => {
      setTentativas((n) => n + 1);
      router.refresh();
    }, INTERVALO);
    return () => clearTimeout(timer);
  }, [tentativas, desistiu, router]);

  return (
    <div className={styles.estado} role="status" aria-live="polite">
      <div className={styles.pulso} data-parado={desistiu ? '' : undefined} aria-hidden="true" />

      <h2 className={styles.titulo}>
        {desistiu ? 'A geração não respondeu' : 'Este projeto está sendo escrito'}
      </h2>

      <p className={styles.texto}>
        {desistiu
          ? 'Ela ficou marcada como em andamento por tempo demais, o que normalmente significa que a chamada morreu no meio. Volte à entrevista e gere de novo — as respostas continuam salvas.'
          : 'A geração começou em outro momento e ainda não terminou. Esta tela se atualiza sozinha assim que o projeto ficar pronto.'}
      </p>

      {desistiu ? (
        <button type="button" className={styles.acao} onClick={() => router.refresh()}>
          Verificar de novo
        </button>
      ) : null}
    </div>
  );
}

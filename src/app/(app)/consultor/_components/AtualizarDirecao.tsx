'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import styles from './AtualizarDirecao.module.css';

export function AtualizarDirecao({
  geradoPorIA,
  desatualizado,
}: {
  geradoPorIA: boolean;
  desatualizado: boolean;
}) {
  const router = useRouter();
  const [carregando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function atualizar() {
    if (carregando) return;
    setErro(null);
    iniciar(async () => {
      try {
        const resposta = await fetch('/api/consultor/direcao', {
          method: 'POST',
          cache: 'no-store',
        });
        const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
        if (!resposta.ok) {
          setErro(corpo?.erro ?? 'Não foi possível atualizar agora.');
          return;
        }
        router.refresh();
      } catch {
        setErro('A conexão falhou. Confira sua internet e tente de novo.');
      }
    });
  }

  const rotulo = carregando
    ? 'Lendo sua operação…'
    : desatualizado
      ? 'Recalcular direção'
      : geradoPorIA
        ? 'Atualizar direção'
        : 'Fazer leitura com IA';

  return (
    <div className={styles.bloco}>
      <button type="button" className={styles.botao} onClick={atualizar} disabled={carregando}>
        <RefreshCw
          size={15}
          strokeWidth={2}
          className={carregando ? styles.girando : undefined}
          aria-hidden="true"
        />
        <span aria-live="polite">{rotulo}</span>
      </button>
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

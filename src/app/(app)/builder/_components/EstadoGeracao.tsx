'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { voltarParaEntrevista } from '@/lib/builder/actions';
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
 *
 * DESISTIR PRECISA TER SAÍDA, e essa era a falha. A versão anterior dizia "volte
 * à entrevista e gere de novo" — só que `/builder/[id]` só mostra a entrevista em
 * `rascunho` ou `falhou`, e não havia nada que mudasse o status de volta. A
 * instrução existia, o caminho não. Agora o botão é a Server Action que destrava.
 */
export function EstadoGeracao({ id }: { id: string }) {
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
          ? 'Ela ficou marcada como em andamento por tempo demais, o que normalmente significa que a chamada morreu no meio. Suas respostas continuam salvas — volte à entrevista e gere de novo.'
          : 'A geração começou em outro momento e ainda não terminou. Esta tela se atualiza sozinha assim que o projeto ficar pronto.'}
      </p>

      {desistiu ? (
        <form action={voltarParaEntrevista} className={styles.acoes}>
          <input type="hidden" name="id" value={id} />
          <Destravar />
          <button
            type="button"
            className={styles.secundaria}
            onClick={() => {
              setTentativas(0);
              router.refresh();
            }}
          >
            Verificar de novo
          </button>
        </form>
      ) : null}
    </div>
  );
}

/** `useFormStatus` precisa estar DENTRO do `<form>` — daí o componente separado. */
function Destravar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.acao} disabled={pending}>
      {pending ? 'Voltando…' : 'Voltar à entrevista'}
    </button>
  );
}

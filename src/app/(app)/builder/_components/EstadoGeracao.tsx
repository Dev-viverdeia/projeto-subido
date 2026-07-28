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
 * A ÚNICA tela de espera do Builder.
 *
 * Era o caso de borda — "alguém abriu de outra aba uma solução que está gerando" —
 * e virou o caso principal quando a geração foi para uma tarefa de fundo da Edge
 * Function: a chamada responde em milissegundos e ninguém mais fica segurando a
 * conexão. Quem clicou em "Gerar" chega aqui pelo `router.refresh()`, e quem
 * fechou a aba encontra o mesmo estado ao voltar. O status no banco é a única
 * fonte, então a página se re-renderiza sozinha até ele mudar.
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
          : 'Arquitetura, ferramentas, passo a passo, prompts, riscos e a conta da economia. Leva de um a três minutos, e continua rodando mesmo se você fechar a aba — o projeto vai estar aqui quando você voltar.'}
      </p>

      {/* Número protagonista: o tempo decorrido é o que diz se a espera está
          andando ou travada. Um pulso sozinho não distingue as duas coisas. */}
      {!desistiu ? (
        <p className={styles.cronometro}>
          <span className={styles.relogio}>
            {String(tentativas * (INTERVALO / 1000)).padStart(3, '0')}
          </span>
          s
        </p>
      ) : null}

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

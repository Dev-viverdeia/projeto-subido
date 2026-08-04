'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { voltarParaEntrevista } from '@/lib/builder/actions';
import { PainelEspera } from './PainelEspera';
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
/**
 * Os passos da GERAÇÃO, na ordem em que o documento é escrito. Não são chamadas
 * separadas — são as fases de uma só, narradas. O último fica ativo até o status
 * virar `pronta` no banco, que é o sinal REAL de término.
 */
const PASSOS = [
  'Lendo a sua ideia e as respostas',
  'Desenhando a arquitetura da solução',
  'Escrevendo o passo a passo e os prompts',
];

export function EstadoGeracao({ id, ideia }: { id: string; ideia: string }) {
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
    <PainelEspera
      rotulo="Geração"
      ideia={ideia}
      passos={PASSOS}
      /* ~50s por fase: a geração leva de 1 a 3 minutos, então os dois primeiros
         passos cobrem a primeira metade e o terceiro segura o resto da espera. */
      intervalo={50_000}
      falha={
        desistiu ? (
          <div className={styles.falha}>
            <p className={styles.falhaTexto}>
              A geração ficou marcada como em andamento por tempo demais, o que normalmente
              significa que a chamada morreu no meio. Suas respostas continuam salvas.
            </p>
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
          </div>
        ) : undefined
      }
    />
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

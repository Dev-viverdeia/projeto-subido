'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react';
import styles from './AcompanharProcessamento.module.css';

const ETAPAS = [
  { depois: 0, titulo: 'Salvando a conversa', apoio: 'Organizando áudio e transcrição.' },
  { depois: 8, titulo: 'Lendo os pontos principais', apoio: 'Separando fatos, dores e decisões.' },
  {
    depois: 24,
    titulo: 'Preparando o próximo passo',
    apoio: 'Montando o resumo para sua revisão.',
  },
  { depois: 50, titulo: 'Finalizando a ficha', apoio: 'Conferindo o que será ligado à venda.' },
] as const;

export function AcompanharProcessamento() {
  const router = useRouter();
  const [segundos, setSegundos] = useState(0);
  const etapa = [...ETAPAS].reverse().find((item) => segundos >= item.depois) ?? ETAPAS[0];
  const indice = ETAPAS.indexOf(etapa);

  useEffect(() => {
    const relogio = window.setInterval(() => setSegundos((atual) => atual + 1), 1_000);
    const atualizacao = window.setInterval(() => router.refresh(), 2_500);
    return () => {
      window.clearInterval(relogio);
      window.clearInterval(atualizacao);
    };
  }, [router]);

  return (
    <section className={styles.painel} role="status" aria-live="polite">
      <div className={styles.icone} aria-hidden="true">
        <LoaderCircle size={28} />
      </div>
      <div className={styles.conteudo}>
        <p>Reunião encerrada</p>
        <h2>{segundos > 80 ? 'O resumo ainda está sendo preparado' : etapa.titulo}</h2>
        <span>
          {segundos > 80
            ? 'A conversa está salva. Você pode sair desta tela e voltar depois.'
            : etapa.apoio}
        </span>
        <ol aria-label="Etapas do processamento">
          {ETAPAS.map((item, posicao) => (
            <li
              key={item.titulo}
              data-estado={posicao < indice ? 'feito' : posicao === indice ? 'agora' : 'depois'}
            >
              <span>
                {posicao < indice ? <Check size={13} /> : String(posicao + 1).padStart(2, '0')}
              </span>
              {item.titulo}
            </li>
          ))}
        </ol>
      </div>
      <Link href="/reunioes" className="via-btn via-btn--secondary via-btn--sm">
        <ArrowLeft size={15} aria-hidden="true" /> Voltar às reuniões
      </Link>
    </section>
  );
}

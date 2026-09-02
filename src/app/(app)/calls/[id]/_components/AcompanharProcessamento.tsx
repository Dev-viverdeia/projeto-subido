'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react';
import type { TipoCall } from '@/lib/calls/tipos';
import styles from './AcompanharProcessamento.module.css';

const ETAPAS_REUNIAO = [
  { depois: 0, titulo: 'Salvando a conversa', apoio: 'Organizando áudio e transcrição.' },
  { depois: 8, titulo: 'Lendo os pontos principais', apoio: 'Separando fatos, dores e decisões.' },
  {
    depois: 24,
    titulo: 'Preparando o próximo passo',
    apoio: 'Montando o resumo para sua revisão.',
  },
  { depois: 50, titulo: 'Finalizando a ficha', apoio: 'Conferindo o que será ligado à venda.' },
] as const;

const ETAPAS_KICKOFF = [
  { depois: 0, titulo: 'Salvando o kickoff', apoio: 'Organizando áudio e transcrição.' },
  {
    depois: 8,
    titulo: 'Lendo as decisões',
    apoio: 'Separando resultado, responsáveis e acessos.',
  },
  {
    depois: 24,
    titulo: 'Montando o acordo',
    apoio: 'Organizando limites, responsáveis e próximos passos.',
  },
  {
    depois: 50,
    titulo: 'Preparando sua revisão',
    apoio: 'Nada será confirmado no projeto sem você revisar.',
  },
] as const;

export function AcompanharProcessamento({ tipo }: { tipo: TipoCall }) {
  const router = useRouter();
  const [segundos, setSegundos] = useState(0);
  const kickoff = tipo === 'kickoff';
  const etapas = kickoff ? ETAPAS_KICKOFF : ETAPAS_REUNIAO;
  const etapa = [...etapas].reverse().find((item) => segundos >= item.depois) ?? etapas[0];
  const indice = etapas.findIndex((item) => item.titulo === etapa.titulo);

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
        <p>{kickoff ? 'Kickoff encerrado' : 'Reunião encerrada'}</p>
        <h2>
          {segundos > 80
            ? kickoff
              ? 'O acordo ainda está sendo preparado'
              : 'O resumo ainda está sendo preparado'
            : etapa.titulo}
        </h2>
        <span>
          {segundos > 80
            ? kickoff
              ? 'O kickoff está salvo. Você pode sair e revisar o acordo depois.'
              : 'A conversa está salva. Você pode sair desta tela e voltar depois.'
            : etapa.apoio}
        </span>
        <ol aria-label={kickoff ? 'Etapas de preparação do acordo' : 'Etapas do processamento'}>
          {etapas.map((item, posicao) => (
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

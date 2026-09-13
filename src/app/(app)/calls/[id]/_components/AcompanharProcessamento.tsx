'use client';

import Link from 'next/link';
import { CircleHelp, Clock3, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/design-system/via';
import type { EstadoResumo } from '@/lib/calls/estado-resumo';
import { linkAjudaNaFalha } from '@/lib/suporte/recuperacao';
import { useAcompanharResumo } from './useAcompanharResumo';
import styles from './AcompanharProcessamento.module.css';

export function AcompanharProcessamento({
  estado,
  reuniaoId,
  oportunidadeId,
}: {
  estado: EstadoResumo;
  reuniaoId: string;
  oportunidadeId: string;
}) {
  const { online, pausado, verificando, verificar } = useAcompanharResumo(estado.acompanhar);
  const esperando = estado.acompanhar && !pausado && online;
  const Icone = !online ? WifiOff : esperando ? Clock3 : CircleHelp;
  const titulo = !online
    ? 'Você está sem conexão.'
    : pausado && estado.acompanhar
      ? 'A consulta automática foi pausada.'
      : estado.titulo;
  const apoio = !online
    ? 'As consultas estão pausadas. Reconecte-se para verificar o resumo.'
    : pausado && estado.acompanhar
      ? 'Ainda não confirmamos a conclusão. Verifique novamente ou peça ajuda.'
      : estado.apoio;
  const podeVerificar = !['indisponivel', 'sem_conteudo'].includes(estado.tipo);
  return (
    <section className={styles.painel} aria-labelledby="estado-resumo-titulo">
      <div className={styles.icone} aria-hidden="true">
        <Icone size={24} />
      </div>
      <div className={styles.conteudo} role={esperando ? 'status' : undefined} aria-live="polite">
        <h2 id="estado-resumo-titulo">{titulo}</h2>
        <p>{apoio}</p>
      </div>
      <div className={styles.acoes}>
        {podeVerificar && (
          <Button
            type="button"
            variant="secondary"
            onClick={verificar}
            disabled={verificando || !online}
            aria-busy={verificando}
            loading={verificando}
            iconLeft={!verificando && <RefreshCw size={17} aria-hidden="true" />}
          >
            {verificando ? 'Verificando…' : 'Verificar novamente'}
          </Button>
        )}
        {estado.acompanhar && !pausado ? (
          <Link className={styles.link} href={`/vendas/${oportunidadeId}`}>
            Abrir ficha do cliente
          </Link>
        ) : podeVerificar ? (
          <Link
            className={styles.link}
            href={linkAjudaNaFalha('resumo_reuniao', `/reunioes/${reuniaoId}`)}
          >
            Pedir ajuda
          </Link>
        ) : null}
      </div>
    </section>
  );
}

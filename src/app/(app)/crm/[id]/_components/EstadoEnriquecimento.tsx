'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Database, Globe2, ScanSearch, Sparkles } from 'lucide-react';
import type { StatusEnriquecimento } from '@/lib/crm/enriquecimento';
import styles from './EstadoEnriquecimento.module.css';

const TENTATIVAS = 60;
const INTERVALO = 4000;

export function EstadoEnriquecimento({
  status,
  erro,
}: {
  status: StatusEnriquecimento;
  erro: string | null;
}) {
  const router = useRouter();
  const [tentativas, setTentativas] = useState(0);
  const ativo = status === 'na_fila' || status === 'processando';

  useEffect(() => {
    if (!ativo || tentativas >= TENTATIVAS) return;
    const timer = setTimeout(() => {
      setTentativas((numero) => numero + 1);
      router.refresh();
    }, INTERVALO);
    return () => clearTimeout(timer);
  }, [ativo, router, tentativas]);

  if (status === 'falhou') {
    return (
      <div className={styles.falha} role="status">
        <ScanSearch size={21} strokeWidth={1.7} aria-hidden="true" />
        <div>
          <strong>A análise não terminou</strong>
          <p>{erro ?? 'Revise as fontes e tente novamente.'}</p>
        </div>
      </div>
    );
  }

  if (!ativo) return null;

  return (
    <section className={styles.estado} aria-live="polite" aria-label="Análise em andamento">
      <div className={styles.cabecalho}>
        <div>
          <p className={styles.sobretitulo}>Análise em andamento</p>
          <h2>Cruzando os sinais deste lead</h2>
          <p>O dossiê continua sendo montado mesmo se você sair desta página.</p>
        </div>
        <span className={styles.pulso} aria-hidden="true" />
      </div>

      <div className={styles.mapa} aria-hidden="true">
        <span className={styles.no}>
          <Database size={17} /> CRM
        </span>
        <span className={styles.traco} />
        <span className={styles.no}>
          <Globe2 size={17} /> Site
        </span>
        <span className={styles.traco} />
        <span className={`${styles.no} ${styles.noAtivo}`}>
          <Sparkles size={17} /> Dossiê
        </span>
      </div>
    </section>
  );
}

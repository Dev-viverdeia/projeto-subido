'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Check, Database, Globe2, ScanSearch, Layers3 } from 'lucide-react';
import { CUSTO_ENRIQUECIMENTO_OPORTUNIDADE } from '@/lib/crm/creditos';
import type { StatusEnriquecimento } from '@/lib/crm/enriquecimento';
import styles from './EstadoEnriquecimento.module.css';

const TENTATIVAS = 60;
const INTERVALO = 4000;

export function EstadoEnriquecimento({
  status,
  erro,
  acao,
}: {
  status: StatusEnriquecimento;
  erro: string | null;
  acao?: ReactNode;
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
      <section className={styles.falha} role="alert" aria-labelledby="pesquisa-falhou-titulo">
        <span className={styles.iconeFalha}>
          <ScanSearch size={21} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <div>
          <p className={styles.sobretitulo}>Enriquecimento interrompido</p>
          <h2 id="pesquisa-falhou-titulo">Não foi possível atualizar a ficha.</h2>
          <p>
            {erro ?? 'O processamento não foi concluído.'} Os {CUSTO_ENRIQUECIMENTO_OPORTUNIDADE}{' '}
            créditos foram devolvidos automaticamente.
          </p>
        </div>
        {acao && <div className={styles.acaoFalha}>{acao}</div>}
      </section>
    );
  }

  if (!ativo) return null;

  return (
    <section className={styles.estado} aria-live="polite" aria-label="Enriquecimento em andamento">
      <div className={styles.cabecalho}>
        <div>
          <p className={styles.sobretitulo}>Enriquecimento em andamento</p>
          <h2>{status === 'na_fila' ? 'Preparando os dados' : 'Atualizando a ficha do cliente'}</h2>
          <p>
            Você pode continuar trabalhando. Esta página será atualizada quando os novos dados
            estiverem prontos.
          </p>
        </div>
        <span className={styles.pulso} aria-hidden="true" />
      </div>

      <ol className={styles.mapa} aria-label="Etapas do enriquecimento">
        <li data-estado="concluida">
          <span>
            <Check size={14} aria-hidden="true" />
          </span>
          <div>
            <strong>Reunir histórico</strong>
            <small>CRM, Prospecção e calls</small>
          </div>
          <Database size={16} aria-hidden="true" />
        </li>
        <li data-estado={status === 'processando' ? 'concluida' : 'atual'}>
          <span>{status === 'processando' ? <Check size={14} aria-hidden="true" /> : '02'}</span>
          <div>
            <strong>Consultar fontes</strong>
            <small>Site e dados públicos</small>
          </div>
          <Globe2 size={16} aria-hidden="true" />
        </li>
        <li data-estado={status === 'processando' ? 'atual' : 'futura'}>
          <span>03</span>
          <div>
            <strong>Organizar a ficha</strong>
            <small>Canais, fatos e roteiro da call</small>
          </div>
          <Layers3 size={16} aria-hidden="true" />
        </li>
      </ol>
    </section>
  );
}

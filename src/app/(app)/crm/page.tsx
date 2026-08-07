import type { Metadata } from 'next';
import { CheckCircle2, CircleDollarSign, Radar, Sparkles } from 'lucide-react';
import { etapaAberta } from '@/lib/crm/etapas';
import { listarPipeline } from '@/lib/crm/queries';
import { FormularioNovoLead } from './_components/FormularioNovoLead';
import { PipelineCrm } from './_components/PipelineCrm';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'CRM' };

export default async function CrmPage({ searchParams }: PageProps<'/crm'>) {
  const [oportunidades, parametros] = await Promise.all([listarPipeline(), searchParams]);
  const abertas = oportunidades.filter((item) => etapaAberta(item.etapa)).length;
  const emDecisao = oportunidades.filter(
    (item) => item.etapa === 'proposta' || item.etapa === 'negociacao',
  ).length;
  const ganhos = oportunidades.filter((item) => item.etapa === 'ganho').length;

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <div className={styles.introducao}>
          <p className={styles.sobretitulo}>Operação comercial</p>
          <h1>CRM conectado aos fatos</h1>
          <p>
            Organize oportunidades e transforme cada interação em contexto útil para vender e
            entregar melhor.
          </p>
        </div>
        <FormularioNovoLead />
      </header>

      {parametros.novo === 'ok' && (
        <div className={styles.confirmacao} role="status">
          <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
          Lead adicionado. O primeiro fato já entrou na linha do tempo.
        </div>
      )}

      <section className={styles.resumo} aria-label="Resumo do pipeline">
        <article>
          <span className={styles.iconeResumo}>
            <Radar size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <strong>{abertas}</strong>
            <span>oportunidades abertas</span>
          </div>
        </article>
        <article>
          <span className={styles.iconeResumo}>
            <CircleDollarSign size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <strong>{emDecisao}</strong>
            <span>em proposta ou negociação</span>
          </div>
        </article>
        <article>
          <span className={styles.iconeResumo}>
            <Sparkles size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <strong>{ganhos}</strong>
            <span>projetos conquistados</span>
          </div>
        </article>
      </section>

      <section className={styles.quadro} aria-labelledby="pipeline-titulo">
        <div className={styles.quadroTopo}>
          <div>
            <h2 id="pipeline-titulo">Pipeline</h2>
            <p>Use o seletor de cada card para avançar ou corrigir uma etapa.</p>
          </div>
          <span>{oportunidades.length} no total</span>
        </div>
        <PipelineCrm oportunidades={oportunidades} />
      </section>
    </div>
  );
}

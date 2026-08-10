import type { Metadata } from 'next';
import { ArrowRight, CheckCircle2, CircleDollarSign, Database, Radar, Layers3 } from 'lucide-react';
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
        {oportunidades.length > 0 && <FormularioNovoLead />}
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
            <Layers3 size={18} strokeWidth={1.8} aria-hidden="true" />
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
        {oportunidades.length ? (
          <PipelineCrm oportunidades={oportunidades} />
        ) : (
          <div className={styles.primeiroLead}>
            <div className={styles.primeiroLeadConteudo}>
              <span className={styles.primeiroLeadIcone}>
                <Database size={24} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className={styles.sobretitulo}>Pipeline pronto</p>
              <h3>Comece pelo lead que já está mais perto.</h3>
              <p>
                Cadastre o que você sabe agora. Empresa, contato e oportunidade bastam para a
                plataforma começar a construir o histórico comercial.
              </p>
              <FormularioNovoLead rotulo="Adicionar primeiro lead" />
            </div>

            <ol className={styles.proximosPassos} aria-label="O que acontece depois">
              <li>
                <span>01</span>
                <div>
                  <strong>O lead entra no radar</strong>
                  <p>O CRM abre o dossiê e registra o primeiro fato.</p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>A conversa ganha contexto</strong>
                  <p>Calls, diagnósticos e propostas passam a alimentar a mesma jornada.</p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>A próxima ação fica clara</strong>
                  <p>Você acompanha o avanço sem depender de memória ou planilhas soltas.</p>
                </div>
              </li>
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

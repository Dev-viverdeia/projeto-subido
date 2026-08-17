import type { Metadata } from 'next';
import { ArrowRight, CheckCircle2, Database } from 'lucide-react';
import { etapaAberta } from '@/lib/crm/etapas';
import { listarPipeline } from '@/lib/crm/queries';
import { FormularioNovoLead } from './_components/FormularioNovoLead';
import { PipelineCrm } from './_components/PipelineCrm';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'CRM' };

function primeiroParametro(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor)?.trim().slice(0, 180) ?? '';
}

export default async function CrmPage({ searchParams }: PageProps<'/crm'>) {
  const [oportunidades, parametros] = await Promise.all([listarPipeline(), searchParams]);
  const projetoDeOrigem = primeiroParametro(parametros.projeto);
  const projetoSlug = primeiroParametro(parametros.projetoSlug);
  const abrirDoProjeto = parametros.novo === 'projeto' && Boolean(projetoDeOrigem);
  const abertas = oportunidades.filter((item) => etapaAberta(item.etapa)).length;
  const emDecisao = oportunidades.filter(
    (item) => item.etapa === 'proposta' || item.etapa === 'negociacao',
  ).length;
  const ganhos = oportunidades.filter((item) => item.etapa === 'ganho').length;
  const perdidos = oportunidades.filter((item) => item.etapa === 'perdido').length;

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <div className={styles.introducao}>
          <p className={styles.sobretitulo}>Operação comercial</p>
          <h1>Pipeline comercial</h1>
          <p>
            Três etapas de trabalho para saber quem precisa de atenção agora — com cada desfecho
            registrado.
          </p>
        </div>
        {oportunidades.length > 0 && (
          <FormularioNovoLead
            abertoInicial={abrirDoProjeto}
            tituloInicial={projetoDeOrigem}
            projetoSlug={projetoSlug}
          />
        )}
      </header>

      {parametros.novo === 'ok' && (
        <div className={styles.confirmacao} role="status">
          <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
          Lead adicionado. O primeiro fato já entrou na linha do tempo.
        </div>
      )}

      <section className={styles.resumo} aria-label="Resumo do pipeline">
        <article>
          <div>
            <span>Abertas</span>
            <small>em andamento</small>
          </div>
          <strong>{abertas}</strong>
        </article>
        <article>
          <div>
            <span>Em proposta</span>
            <small>aguardando decisão</small>
          </div>
          <strong>{emDecisao}</strong>
        </article>
        <article data-resultado="ganho">
          <div>
            <span>Ganhas</span>
            <small>projetos aprovados</small>
          </div>
          <strong>{ganhos}</strong>
        </article>
        <article data-resultado="perdido">
          <div>
            <span>Perdidas</span>
            <small>com motivo registrado</small>
          </div>
          <strong>{perdidos}</strong>
        </article>
      </section>

      <section className={styles.quadro} aria-labelledby="pipeline-titulo">
        <div className={styles.quadroTopo}>
          <div>
            <h2 id="pipeline-titulo">Pipeline</h2>
            <p>Avance cada oportunidade quando a conversa realmente mudar de fase.</p>
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
              <FormularioNovoLead
                rotulo="Adicionar primeiro lead"
                abertoInicial={abrirDoProjeto}
                tituloInicial={projetoDeOrigem}
                projetoSlug={projetoSlug}
              />
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

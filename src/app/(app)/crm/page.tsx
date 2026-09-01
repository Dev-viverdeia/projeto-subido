import type { Metadata } from 'next';
import { ArrowRight, Database } from 'lucide-react';
import { listarPipeline } from '@/lib/crm/queries';
import { RetornoOperacao } from '../_components/RetornoOperacao';
import { FormularioNovoLead } from './_components/FormularioNovoLead';
import { PipelineCrm } from './_components/PipelineCrm';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Vendas' };

function primeiroParametro(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor)?.trim().slice(0, 180) ?? '';
}

export default async function CrmPage({ searchParams }: PageProps<'/crm'>) {
  const [oportunidades, parametros] = await Promise.all([listarPipeline(), searchParams]);
  const projetoDeOrigem = primeiroParametro(parametros.projeto);
  const projetoSlug = primeiroParametro(parametros.projetoSlug);
  const abrirDoProjeto = parametros.novo === 'projeto' && Boolean(projetoDeOrigem);

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <div className={styles.linhaTopo}>
          <div className={styles.introducao}>
            <p className={styles.sobretitulo}>Seus clientes em negociação</p>
            <h1>Vendas</h1>
            <p>Acompanhe cada projeto em negociação e saiba o que fazer em seguida.</p>
          </div>
          {oportunidades.length > 0 && (
            <FormularioNovoLead
              abertoInicial={abrirDoProjeto}
              tituloInicial={projetoDeOrigem}
              projetoSlug={projetoSlug}
            />
          )}
        </div>
      </header>

      {parametros.novo === 'ok' && (
        <RetornoOperacao
          tom="sucesso"
          titulo="Venda adicionada"
          descricao="A ficha já está no quadro e pronta para o próximo passo."
        />
      )}

      <section className={styles.quadro} aria-labelledby="pipeline-titulo">
        <h2 id="pipeline-titulo" className={styles.tituloOculto}>
          Quadro de vendas
        </h2>
        {oportunidades.length ? (
          <PipelineCrm oportunidades={oportunidades} />
        ) : (
          <div className={styles.primeiroLead}>
            <div className={styles.primeiroLeadConteudo}>
              <span className={styles.primeiroLeadIcone}>
                <Database size={24} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className={styles.sobretitulo}>Primeira venda</p>
              <h3>Adicione uma empresa que você decidiu abordar.</h3>
              <p>
                Empresa e contato são suficientes. A plataforma ajuda a pesquisar o negócio e a
                preparar o próximo passo.
              </p>
              <FormularioNovoLead
                rotulo="Adicionar primeira empresa"
                abertoInicial={abrirDoProjeto}
                tituloInicial={projetoDeOrigem}
                projetoSlug={projetoSlug}
              />
            </div>

            <ol className={styles.proximosPassos} aria-label="O que acontece depois">
              <li>
                <span>01</span>
                <div>
                  <strong>Prepare a abordagem</strong>
                  <p>Pesquise a empresa, o contato e o projeto que pode ser vendido.</p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Faça a descoberta</strong>
                  <p>Use a reunião para confirmar o problema, a prioridade e quem decide.</p>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Envie a proposta</strong>
                  <p>Monte o escopo, registre o follow-up e acompanhe a resposta.</p>
                </div>
              </li>
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

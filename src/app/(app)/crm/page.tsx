import type { Metadata } from 'next';
import { ArrowRight, Database } from 'lucide-react';
import { listarPipeline } from '@/lib/crm/queries';
import { CabecalhoOperacional } from '../_components/CabecalhoOperacional';
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
      <CabecalhoOperacional
        titulo="Vendas"
        descricao="Acompanhe cada oportunidade e o próximo passo."
        acao={
          oportunidades.length > 0 ? (
            <FormularioNovoLead
              rotulo="Nova oportunidade"
              abertoInicial={abrirDoProjeto}
              tituloInicial={projetoDeOrigem}
              projetoSlug={projetoSlug}
            />
          ) : undefined
        }
      />

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
              <h3>Adicione sua primeira oportunidade.</h3>
              <p>Cadastre a empresa e o contato. A ficha organiza os próximos passos.</p>
              <FormularioNovoLead
                rotulo="Adicionar oportunidade"
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
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Descubra o problema</strong>
                </div>
                <ArrowRight size={17} aria-hidden="true" />
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Envie a proposta</strong>
                </div>
              </li>
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

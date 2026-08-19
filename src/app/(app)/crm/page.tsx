import type { Metadata } from 'next';
import { ArrowRight, CheckCircle2, Database } from 'lucide-react';
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
  const abertas = oportunidades.filter(
    (oportunidade) => oportunidade.etapa !== 'ganho' && oportunidade.etapa !== 'perdido',
  );
  const fases = [
    {
      numero: '01',
      titulo: 'Preparar',
      descricao: 'Pesquisar e abordar',
      total: abertas.filter(
        (oportunidade) =>
          oportunidade.etapa === 'novo_lead' || oportunidade.etapa === 'qualificacao',
      ).length,
    },
    {
      numero: '02',
      titulo: 'Descobrir',
      descricao: 'Entender a dor',
      total: abertas.filter((oportunidade) => oportunidade.etapa === 'descoberta').length,
    },
    {
      numero: '03',
      titulo: 'Propor',
      descricao: 'Escopo e decisão',
      total: abertas.filter(
        (oportunidade) => oportunidade.etapa === 'proposta' || oportunidade.etapa === 'negociacao',
      ).length,
    },
  ];

  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <div className={styles.linhaTopo}>
          <div className={styles.introducao}>
            <p className={styles.sobretitulo}>Sua operação comercial</p>
            <h1>Oportunidades</h1>
            <p>Um método simples para vender projetos de IA com a próxima ação clara.</p>
          </div>
          {oportunidades.length > 0 && (
            <FormularioNovoLead
              abertoInicial={abrirDoProjeto}
              tituloInicial={projetoDeOrigem}
              projetoSlug={projetoSlug}
            />
          )}
        </div>

        <div className={styles.trilhaMetodo} aria-label="Etapas do método de venda">
          {fases.map((fase) => (
            <div key={fase.numero}>
              <span>{fase.numero}</span>
              <div>
                <strong>{fase.titulo}</strong>
                <small>{fase.descricao}</small>
              </div>
              <b aria-label={`${fase.total} oportunidades`}>{fase.total}</b>
            </div>
          ))}
        </div>
      </header>

      {parametros.novo === 'ok' && (
        <div className={styles.confirmacao} role="status">
          <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
          Oportunidade adicionada ao CRM.
        </div>
      )}

      <section className={styles.quadro} aria-labelledby="pipeline-titulo">
        <h2 id="pipeline-titulo" className={styles.tituloOculto}>
          Pipeline de oportunidades
        </h2>
        {oportunidades.length ? (
          <PipelineCrm oportunidades={oportunidades} />
        ) : (
          <div className={styles.primeiroLead}>
            <div className={styles.primeiroLeadConteudo}>
              <span className={styles.primeiroLeadIcone}>
                <Database size={24} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className={styles.sobretitulo}>Primeira oportunidade</p>
              <h3>Adicione uma empresa que você decidiu abordar.</h3>
              <p>
                Empresa e contato são suficientes. A plataforma ajuda a pesquisar o negócio e a
                preparar o próximo passo.
              </p>
              <FormularioNovoLead
                rotulo="Criar primeira oportunidade"
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
                  <p>Use a call para confirmar o problema, a prioridade e quem decide.</p>
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

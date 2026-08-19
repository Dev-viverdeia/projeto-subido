import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, CircleHelp, MessageSquareQuote, Radar, Target } from 'lucide-react';
import { obterDossieLead } from '@/lib/crm/queries';
import { CabecalhoDossie } from './_components/CabecalhoDossie';
import { EstadoEnriquecimento } from './_components/EstadoEnriquecimento';
import { FormularioEnriquecimento } from './_components/FormularioEnriquecimento';
import { JornadaEntradaLead, type EstadoContextoLead } from './_components/JornadaEntradaLead';
import { PesquisaComercial } from './_components/PesquisaComercial';
import { ResumoOperacionalLead } from './_components/ResumoOperacionalLead';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Oportunidade · CRM' };

export default async function OportunidadePage({ params, searchParams }: PageProps<'/crm/[id]'>) {
  const [{ id }, parametros] = await Promise.all([params, searchParams]);
  const lead = await obterDossieLead(id);
  if (!lead) notFound();

  const ultima = lead.enriquecimentos[0] ?? null;
  const emAndamento =
    ultima?.status === 'na_fila' || ultima?.status === 'processando' ? ultima : null;
  const falhaRecente = ultima?.status === 'falhou' ? ultima : null;
  const execucaoPronta = lead.enriquecimentos.find(
    (execucao) => execucao.status === 'concluido' && execucao.dossie,
  );
  const dossie = execucaoPronta?.dossie ?? null;
  const entradaRecente = parametros.novo === '1';
  const falhaNovoCiclo = parametros['novo-ciclo'] === 'erro';
  const projetoDeOrigem =
    typeof parametros.projeto === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parametros.projeto)
      ? parametros.projeto.slice(0, 160)
      : null;
  const estadoContexto: EstadoContextoLead = dossie
    ? 'pronto'
    : emAndamento
      ? 'processando'
      : falhaRecente
        ? 'falhou'
        : 'pendente';

  return (
    <div className={styles.pagina}>
      <Link href="/crm" className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        Voltar ao pipeline
      </Link>

      <CabecalhoDossie
        lead={lead}
        enriquecimentoEmAndamento={Boolean(emAndamento)}
        temDossie={Boolean(dossie)}
        modoEntrada={entradaRecente}
      />

      {falhaNovoCiclo && (
        <p className={styles.avisoOperacao} role="alert">
          Não conseguimos abrir outro ciclo agora. Esta oportunidade continua salva; tente
          novamente.
        </p>
      )}

      {entradaRecente ? (
        <JornadaEntradaLead
          oportunidadeId={lead.oportunidade.id}
          empresaNome={lead.empresa.nome}
          dominio={lead.empresa.dominio}
          linkedin={lead.contato?.linkedinUrl ?? null}
          estadoContexto={estadoContexto}
          totalCalls={lead.totalCalls}
          projetoSlug={projetoDeOrigem}
        />
      ) : (
        <ResumoOperacionalLead lead={lead} />
      )}

      {!entradaRecente && emAndamento && (
        <EstadoEnriquecimento status={emAndamento.status} erro={null} />
      )}

      {!entradaRecente && falhaRecente && (
        <EstadoEnriquecimento
          status={falhaRecente.status}
          erro={falhaRecente.erro}
          acao={
            <FormularioEnriquecimento
              oportunidadeId={lead.oportunidade.id}
              dominioInicial={lead.empresa.dominio}
              linkedinInicial={lead.contato?.linkedinUrl ?? null}
              temDossie={Boolean(dossie)}
              rotulo="Tentar novamente"
            />
          }
        />
      )}

      {!entradaRecente && !dossie && !emAndamento && !falhaRecente && (
        <section className={styles.primeiroDossie} aria-labelledby="primeira-pesquisa-titulo">
          <div className={styles.convitePesquisa}>
            <span className={styles.iconeVazio}>
              <Radar size={22} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div>
              <p className={styles.sobretitulo}>Pesquisa comercial</p>
              <h2 id="primeira-pesquisa-titulo">Chegue à conversa sabendo onde investigar.</h2>
              <p>
                Informe o site e o que você já sabe. A plataforma cruza CRM, calls e fontes públicas
                para sugerir perguntas e o próximo movimento.
              </p>
            </div>
            <FormularioEnriquecimento
              oportunidadeId={lead.oportunidade.id}
              dominioInicial={lead.empresa.dominio}
              linkedinInicial={lead.contato?.linkedinUrl ?? null}
              temDossie={false}
            />
          </div>

          <div className={styles.entregas} aria-label="O que a pesquisa prepara">
            <span>
              <BadgeCheck size={16} aria-hidden="true" /> Fatos com fonte
            </span>
            <span>
              <CircleHelp size={16} aria-hidden="true" /> Hipóteses separadas
            </span>
            <span>
              <MessageSquareQuote size={16} aria-hidden="true" /> Perguntas para a call
            </span>
            <span>
              <Target size={16} aria-hidden="true" /> Próximo movimento
            </span>
          </div>
        </section>
      )}

      {!entradaRecente && dossie && execucaoPronta && (
        <PesquisaComercial lead={lead} execucao={execucaoPronta} dossie={dossie} />
      )}
    </div>
  );
}

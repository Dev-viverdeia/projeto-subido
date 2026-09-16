import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CabecalhoDossie } from '@/app/(app)/crm/[id]/_components/CabecalhoDossie';
import { ContextoPosEntrega } from '@/app/(app)/crm/[id]/_components/ContextoPosEntrega';
import { EstadoEnriquecimento } from '@/app/(app)/crm/[id]/_components/EstadoEnriquecimento';
import { PesquisaComercial } from '@/app/(app)/crm/[id]/_components/PesquisaComercial';
import { ResumoOperacionalLead } from '@/app/(app)/crm/[id]/_components/ResumoOperacionalLead';
import { InteligenciaDeContato } from '@/app/(app)/crm/[id]/_components/InteligenciaDeContato';
import pagina from '@/app/(app)/crm/[id]/pagina.module.css';
import { LEAD_OPERACIONAL } from './leadOperacionalPreview';
import shell from '../mapa-jornada/preview.module.css';
import { PreviewSidebar } from './PreviewSidebar';
import { criarLeadContinuidade } from './criarLeadContinuidade';
import { criarLeadEncerrado } from './criarLeadEncerrado';
import { criarLeadNovo } from './criarLeadNovo';
import { criarCenarioVenda } from './criarCenarioVenda';
import { criarContatosPreview } from './criarContatosPreview';
import { ContatosEditaveisPreview } from './ContatosEditaveisPreview';
import { EmpresaEditavelPreview } from './EmpresaEditavelPreview';
import { VendaEditavelPreview } from './VendaEditavelPreview';

export const metadata: Metadata = { title: 'Preview · Ficha do cliente' };

const LEAD_NOVO = criarLeadNovo(LEAD_OPERACIONAL);
const LEAD_GANHO = criarLeadEncerrado(LEAD_OPERACIONAL, 'ganho');
const LEAD_PERDIDO = criarLeadEncerrado(LEAD_OPERACIONAL, 'perdido');
const LEAD_CONTINUIDADE = criarLeadContinuidade(LEAD_OPERACIONAL, LEAD_NOVO);

export default async function PreviewDossiePage({
  searchParams,
}: PageProps<'/preview/crm-dossie'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const entrada = parametros.entrada === '1';
  const pesquisaPendente = parametros.pesquisa === 'pendente';
  const enriquecendo = parametros.enriquecimento === 'processando';
  const enriquecimentoFalhou = parametros.enriquecimento === 'falhou';
  const posEntrega = parametros['pos-entrega'] === '1';
  const base =
    typeof parametros.cenario === 'string'
      ? criarCenarioVenda(LEAD_OPERACIONAL, parametros.cenario)
      : posEntrega
        ? LEAD_CONTINUIDADE
        : parametros.resultado === 'ganho'
          ? LEAD_GANHO
          : parametros.resultado === 'perdido'
            ? LEAD_PERDIDO
            : entrada || pesquisaPendente
              ? LEAD_NOVO
              : LEAD_OPERACIONAL;
  const execucao = LEAD_OPERACIONAL.enriquecimentos[0]!;
  const lead =
    typeof parametros.contatos === 'string'
      ? criarContatosPreview(base, parametros.contatos)
      : base;

  return (
    <div className={shell.shell}>
      <PreviewSidebar />

      <main id="conteudo" className={shell.conteudo}>
        <div className={pagina.pagina}>
          <span className={pagina.voltar}>
            <ArrowLeft size={15} aria-hidden="true" /> Voltar ao pipeline
          </span>
          {typeof parametros.venda === 'string' ? (
            <VendaEditavelPreview lead={lead} cenario={parametros.venda} />
          ) : typeof parametros.empresa === 'string' ? (
            <EmpresaEditavelPreview lead={lead} cenario={parametros.empresa} />
          ) : (
            <CabecalhoDossie
              lead={lead}
              enriquecimentoEmAndamento={enriquecendo}
              temDossie={!entrada && !pesquisaPendente}
            />
          )}

          {enriquecendo && <EstadoEnriquecimento status="processando" erro={null} />}
          {enriquecimentoFalhou && (
            <EstadoEnriquecimento
              status="falhou"
              erro="Não conseguimos concluir a pesquisa nas fontes disponíveis."
            />
          )}

          {entrada && (
            <p className={pagina.avisoSucesso} role="status">
              Venda adicionada. A ficha do cliente já está pronta para você trabalhar.
            </p>
          )}
          {lead.continuidadePosEntrega && (
            <ContextoPosEntrega continuidade={lead.continuidadePosEntrega} />
          )}
          {typeof parametros.edicao === 'string' ? (
            <ContatosEditaveisPreview lead={lead} cenario={parametros.edicao} />
          ) : (
            <InteligenciaDeContato
              lead={lead}
              dossie={entrada || pesquisaPendente ? null : execucao.dossie}
            />
          )}
          <ResumoOperacionalLead lead={lead} />
          {!entrada && !pesquisaPendente && (
            <PesquisaComercial lead={lead} execucao={execucao} dossie={execucao.dossie!} />
          )}
        </div>
      </main>
    </div>
  );
}

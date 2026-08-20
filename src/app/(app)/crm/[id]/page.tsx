import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { obterDossieLead } from '@/lib/crm/queries';
import { CabecalhoDossie } from './_components/CabecalhoDossie';
import { EstadoEnriquecimento } from './_components/EstadoEnriquecimento';
import { FormularioEnriquecimento } from './_components/FormularioEnriquecimento';
import { PesquisaComercial } from './_components/PesquisaComercial';
import { ResumoOperacionalLead } from './_components/ResumoOperacionalLead';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Ficha do cliente · Vendas' };

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
  return (
    <div className={styles.pagina}>
      <Link href="/vendas" className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        Voltar para Vendas
      </Link>

      <CabecalhoDossie
        lead={lead}
        enriquecimentoEmAndamento={Boolean(emAndamento)}
        temDossie={Boolean(dossie)}
        projetoSlug={projetoDeOrigem}
      />

      {entradaRecente && (
        <p className={styles.avisoSucesso} role="status">
          Venda adicionada. A ficha do cliente já está pronta para você trabalhar.
        </p>
      )}

      {falhaNovoCiclo && (
        <p className={styles.avisoOperacao} role="alert">
          Não conseguimos abrir outra venda agora. Esta ficha continua salva; tente novamente.
        </p>
      )}

      <ResumoOperacionalLead lead={lead} />

      {emAndamento && <EstadoEnriquecimento status={emAndamento.status} erro={null} />}

      {falhaRecente && (
        <EstadoEnriquecimento
          status={falhaRecente.status}
          erro={falhaRecente.erro}
          acao={
            <FormularioEnriquecimento
              oportunidadeId={lead.oportunidade.id}
              saldoCreditos={lead.saldoCreditos ?? 30}
              temDossie={Boolean(dossie)}
              rotulo="Tentar novamente"
              tom="secundario"
            />
          }
        />
      )}

      {dossie && execucaoPronta && (
        <PesquisaComercial lead={lead} execucao={execucaoPronta} dossie={dossie} />
      )}
    </div>
  );
}

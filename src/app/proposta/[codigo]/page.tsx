import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterPropostaPublica } from '@/lib/propostas/portal';
import { DecisaoCliente } from './DecisaoCliente';
import { PropostaDocumento } from './PropostaDocumento';
import { RegistrarVisualizacao } from './RegistrarVisualizacao';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Proposta comercial',
  robots: { index: false, follow: false },
};

export default async function PropostaClientePage({ params }: PageProps<'/proposta/[codigo]'>) {
  const { codigo } = await params;
  const proposta = await obterPropostaPublica(codigo);
  if (!proposta) notFound();

  return (
    <>
      <RegistrarVisualizacao codigo={codigo} />
      <PropostaDocumento
        proposta={proposta}
        pdfHref={`/api/proposta/${codigo}/pdf`}
        decisao={
          <DecisaoCliente
            codigo={codigo}
            nomeInicial={proposta.documento.cliente.contato ?? ''}
            emailInicial={proposta.documento.cliente.email ?? ''}
            linkPagamento={proposta.documento.investimento.linkPagamento ?? null}
            valorCentavos={proposta.documento.investimento.valorCentavos}
          />
        }
      />
    </>
  );
}

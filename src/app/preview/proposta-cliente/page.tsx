import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PropostaDocumento } from '@/app/proposta/[codigo]/PropostaDocumento';
import { PROPOSTA_PREVIEW } from './fixture';
import { DecisaoPreview } from './DecisaoPreview';

export const metadata: Metadata = {
  title: 'Preview · Proposta do cliente',
  robots: { index: false, follow: false },
};

export default async function PreviewPropostaCliente({
  searchParams,
}: PageProps<'/preview/proposta-cliente'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { estado } = await searchParams;
  const proposta = structuredClone(PROPOSTA_PREVIEW);
  if (estado === 'aceita' || estado === 'recusada') {
    proposta.status = estado;
    proposta.decisaoNome = 'Camila Rios';
    proposta.decididaEm = '2026-09-11T18:00:00Z';
    proposta.decisaoComentario = 'Vamos retomar este projeto no próximo trimestre.';
  }
  if (estado === 'sem-valor') {
    proposta.documento.investimento.valorCentavos = null;
    proposta.documento.investimento.linkPagamento = null;
    proposta.documento.fornecedor = null;
  }
  if (estado === 'longo') {
    const d = proposta.documento;
    d.projeto.titulo =
      'Atendimento e qualificação de clientes com inteligência artificial para todas as unidades e serviços da empresa';
    d.cliente.empresa =
      'Clínica Aurora de atendimento especializado e acompanhamento integrado de saúde';
    d.investimento.condicoes =
      '50% no início e 50% após a validação do projeto.\nA implantação depende dos acessos e das aprovações previstas neste documento.';
    d.escopo = Array.from({ length: 10 }, (_, i) => ({
      titulo: `Frente ${i + 1}: configuração e validação dos processos de atendimento`,
      descricao: 'Os critérios de atendimento serão definidos junto à equipe responsável. '.repeat(
        15,
      ),
    }));
    d.cronograma = Array.from({ length: 8 }, (_, i) => ({
      fase: `Etapa ${i + 1}: validação com a equipe responsável`,
      duracao: `Semana ${i + 1}`,
      descricao:
        'Testar regras, registrar resultados e revisar os casos excepcionais antes de publicar.',
    }));
    d.observacoes = 'As mensalidades e integrações dependem de aprovação do cliente. '.repeat(20);
  }
  return (
    <PropostaDocumento
      proposta={proposta}
      pdfHref="/api/proposta/00000000-0000-4000-8000-000000000000/pdf"
      decisao={
        <DecisaoPreview
          erro={estado === 'erro'}
          valorCentavos={proposta.documento.investimento.valorCentavos}
          pagamento={Boolean(proposta.documento.investimento.linkPagamento)}
        />
      }
    />
  );
}

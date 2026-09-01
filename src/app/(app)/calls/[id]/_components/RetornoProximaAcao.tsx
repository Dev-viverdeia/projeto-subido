import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { RetornoOperacao } from '../../../_components/RetornoOperacao';

export function RetornoProximaAcao({
  estado,
  oportunidadeId,
}: {
  estado: string | null;
  oportunidadeId: string;
}) {
  if (estado === 'ok') {
    return (
      <RetornoOperacao
        tom="sucesso"
        titulo="Plano aplicado"
        descricao="A ficha, a etapa da venda e os compromissos já refletem o que foi confirmado."
        acao={
          <Link href={`/vendas/${oportunidadeId}`}>
            Abrir ficha <ArrowRight size={14} aria-hidden="true" />
          </Link>
        }
      />
    );
  }

  if (estado === 'sem-alteracao') {
    return (
      <RetornoOperacao
        titulo="Plano já sincronizado"
        descricao="Nada foi duplicado."
        acao={
          <Link href={`/vendas/${oportunidadeId}`}>
            Abrir ficha <ArrowRight size={14} aria-hidden="true" />
          </Link>
        }
      />
    );
  }

  if (estado === 'erro') {
    return (
      <RetornoOperacao
        tom="erro"
        titulo="O plano não foi aplicado"
        descricao="Revise os campos antes de tentar novamente."
      />
    );
  }

  return null;
}

import { obterPainelSobral } from '@/lib/consultor/queries';
import type { JornadaOperacional } from '@/lib/jornada/queries';
import { resolverPrioridadeInicio } from '@/lib/jornada/prioridade';
import { PrioridadeOperacional } from './PrioridadeOperacional';

export async function PrioridadeSobralInicio({ jornada }: { jornada: JornadaOperacional }) {
  const painel = await obterPainelSobral(jornada);
  const prioridade = resolverPrioridadeInicio(jornada.plano, painel.sinais);

  return (
    <PrioridadeOperacional
      modo={prioridade.modo}
      etapa={prioridade.etapa}
      foco={prioridade.foco}
      titulo={prioridade.titulo}
      detalhe={prioridade.detalhe}
      rotuloEvidencia={prioridade.rotuloEvidencia}
      evidencia={prioridade.evidencia}
      destino={prioridade.destino}
      acao={prioridade.acao}
    />
  );
}

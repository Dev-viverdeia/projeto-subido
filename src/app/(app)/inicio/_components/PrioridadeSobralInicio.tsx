import { obterPainelSobral } from '@/lib/consultor/queries';
import type { JornadaOperacional } from '@/lib/jornada/queries';
import { resolverPrioridadeInicio } from '@/lib/jornada/prioridade';
import {
  PLANOS_SUBIDO,
  RECURSOS_SUBIDO,
  destinoDeUpgrade,
  planoTemRecurso,
  recursoDaRota,
  type PlanoSubido,
} from '@/lib/planos/acessos';
import { PrioridadeOperacional } from './PrioridadeOperacional';

export function prioridadePermitidaNoPlano(
  prioridade: ReturnType<typeof resolverPrioridadeInicio>,
  plano: PlanoSubido,
) {
  const recurso = recursoDaRota(prioridade.destino);
  if (!recurso || planoTemRecurso(plano, recurso)) return prioridade;

  const planoNecessario = PLANOS_SUBIDO[RECURSOS_SUBIDO[recurso].planoMinimo].nome;
  return {
    ...prioridade,
    destino: destinoDeUpgrade(recurso, prioridade.destino),
    acao: `Ver plano ${planoNecessario}`,
  };
}

export async function PrioridadeSobralInicio({
  jornada,
  plano,
}: {
  jornada: JornadaOperacional;
  plano: PlanoSubido;
}) {
  const prioridadeBase = await obterPainelSobral(jornada)
    .then((painel) => resolverPrioridadeInicio(jornada.plano, painel.sinais))
    .catch((erro: unknown) => {
      console.error('[inicio:prioridade]', erro);
      const etapa =
        jornada.plano.etapas.find((item) => item.id === jornada.plano.etapaAtual) ??
        jornada.plano.etapas[0]!;
      const passo = jornada.plano.proximoPasso;
      return {
        modo: 'plano da jornada' as const,
        etapa: etapa.titulo,
        foco: etapa.marco,
        titulo: passo.titulo,
        detalhe: passo.detalhe,
        rotuloEvidencia: 'Evidência atual' as const,
        evidencia: passo.evidencia,
        destino: passo.destino,
        acao: passo.acao,
      };
    });
  const prioridade = prioridadePermitidaNoPlano(prioridadeBase, plano);

  return (
    <PrioridadeOperacional
      etapa={prioridade.etapa}
      titulo={prioridade.titulo}
      detalhe={prioridade.detalhe}
      evidencia={prioridade.evidencia}
      destino={prioridade.destino}
      acao={prioridade.acao}
    />
  );
}

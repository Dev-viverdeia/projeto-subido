import { ETAPAS_SOBRAL } from '@/lib/consultor/direcao';
import { resolverAcaoSobral } from '@/lib/consultor/destino';
import { obterPainelSobral } from '@/lib/consultor/queries';
import { PrioridadeOperacional } from './PrioridadeOperacional';

export async function PrioridadeSobralInicio() {
  const painel = await obterPainelSobral();
  const etapa = ETAPAS_SOBRAL.find((item) => item.id === painel.plano.etapa);
  const acao = resolverAcaoSobral(painel.plano.proximoPasso, painel.sinais);

  return (
    <PrioridadeOperacional
      modo={painel.geradoPorIA ? 'leitura com IA' : 'leitura factual'}
      etapa={etapa?.titulo ?? 'Operação'}
      foco={painel.plano.foco}
      titulo={painel.plano.proximoPasso.titulo}
      detalhe={painel.plano.proximoPasso.detalhe}
      evidencia={painel.plano.proximoPasso.evidencia}
      destino={acao.destino}
      acao={acao.rotulo}
    />
  );
}

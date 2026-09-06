import { listarProjetosExecucao } from '@/lib/projetos-execucao/queries';
import { montarPendenciasEntrega } from '@/lib/projetos-execucao/alertas';
import { MenuPendencias } from './MenuPendencias';

/** Avisos não bloqueiam a primeira renderização da tela de trabalho. */
export async function PendenciasDoCabecalho() {
  const projetos = await listarProjetosExecucao().catch((erro: unknown) => {
    console.error('[app-layout:pendencias-entrega]', erro);
    return null;
  });
  return projetos ? <MenuPendencias pendencias={montarPendenciasEntrega(projetos)} /> : null;
}

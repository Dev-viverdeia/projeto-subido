import type { SinaisSobral } from '@/lib/consultor/direcao';
import type { DominioRadarSobral, ItemRadarSobral } from '@/lib/consultor/radar';
import type { PassoJornada, PlanoJornada } from './motor';

export type PrioridadeInicio = {
  modo: 'prioridade da operação' | 'plano da jornada';
  etapa: string;
  foco: string;
  titulo: string;
  detalhe: string;
  rotuloEvidencia: 'Evidência atual' | 'Registro de conclusão';
  evidencia: string;
  destino: string;
  acao: string;
};

const ESTADOS_URGENTES = new Set<ItemRadarSobral['estado']>(['ao_vivo', 'atrasado', 'hoje']);

const ROTULO_DOMINIO: Record<DominioRadarSobral, string> = {
  crm: 'Abrir no CRM',
  calls: 'Abrir call',
  propostas: 'Abrir proposta',
  projetos: 'Abrir projeto',
  plano: 'Abrir compromisso',
};

const EVIDENCIA_DOMINIO: Record<DominioRadarSobral, string> = {
  crm: 'Resultado registrado e próxima ação definida no CRM.',
  calls: 'Call concluída com fatos e próximo compromisso registrados.',
  propostas: 'Decisão do cliente e próxima ação registradas na proposta.',
  projetos: 'Compromisso concluído ou replanejado dentro do projeto do cliente.',
  plano: 'Compromisso atualizado com resultado, responsável e próximo passo.',
};

function dominioDoPasso(passo: PassoJornada): DominioRadarSobral | null {
  if (passo.destino === '/crm') return 'crm';
  if (passo.destino === '/calls') return 'calls';
  if (passo.destino === '/propostas') return 'propostas';
  if (passo.destino === '/solucoes' || passo.destino.startsWith('/solucoes/execucao/')) {
    return 'projetos';
  }
  return null;
}

function resolverDestinoDoPasso(
  passo: PassoJornada,
  sinais: SinaisSobral,
): Pick<PrioridadeInicio, 'destino' | 'acao'> {
  if (passo.destino === '/propostas/nova' && sinais.foco) {
    return {
      destino: `/propostas/nova?oportunidade=${encodeURIComponent(sinais.foco.oportunidadeId)}`,
      acao: passo.acao,
    };
  }

  if (!['/crm', '/calls', '/propostas', '/solucoes'].includes(passo.destino)) {
    return { destino: passo.destino, acao: passo.acao };
  }

  const dominio = dominioDoPasso(passo);
  const registro = dominio ? sinais.radar.find((item) => item.dominio === dominio) : null;
  if (!registro && passo.destino === '/calls' && sinais.foco) {
    return {
      destino: `/calls?nova=1&oportunidade=${encodeURIComponent(sinais.foco.oportunidadeId)}`,
      acao: passo.acao,
    };
  }
  return registro
    ? { destino: registro.destino, acao: ROTULO_DOMINIO[registro.dominio] }
    : { destino: passo.destino, acao: passo.acao };
}

/**
 * A Início tem uma única autoridade de decisão: urgência factual vence; sem
 * urgência, o próximo marco da jornada vence. A leitura livre do Sobral AI
 * continua explicando e tirando dúvidas, mas não abre um segundo roadmap.
 */
export function resolverPrioridadeInicio(
  plano: PlanoJornada,
  sinais: SinaisSobral,
): PrioridadeInicio {
  const etapa = plano.etapas.find((item) => item.id === plano.etapaAtual) ?? plano.etapas[0]!;
  const urgente = sinais.radar.find((item) => ESTADOS_URGENTES.has(item.estado));

  if (urgente) {
    return {
      modo: 'prioridade da operação',
      etapa: etapa.titulo,
      foco: urgente.momento,
      titulo: urgente.titulo,
      detalhe: `${urgente.contexto}. Resolva este item antes de começar outra tarefa.`,
      rotuloEvidencia: 'Registro de conclusão',
      evidencia: EVIDENCIA_DOMINIO[urgente.dominio],
      destino: urgente.destino,
      acao: ROTULO_DOMINIO[urgente.dominio],
    };
  }

  const passo = plano.proximoPasso;
  const destino = resolverDestinoDoPasso(passo, sinais);
  return {
    modo: 'plano da jornada',
    etapa: etapa.titulo,
    foco: `Meta da etapa · ${etapa.marco}`,
    titulo: passo.titulo,
    detalhe: passo.detalhe,
    rotuloEvidencia: 'Evidência atual',
    evidencia: passo.evidencia,
    destino: destino.destino,
    acao: destino.acao,
  };
}

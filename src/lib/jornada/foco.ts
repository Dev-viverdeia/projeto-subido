import type { MetricasProgressoConta } from '@/lib/progresso/queries';
import type { FatosJornadaOperacional } from './queries';
import { montarPlanoJornada, type PerfilJornada, type PlanoJornada } from './motor';

/**
 * Recalcula a jornada comercial apenas com fatos do cliente em foco. Formação
 * continua sendo da conta; descoberta, proposta e entrega pertencem à mesma
 * oportunidade para o Sobral AI não misturar clientes.
 */
export function montarPlanoJornadaEmFoco({
  perfil,
  aprendizado,
  fatos,
  oportunidadeId,
}: {
  perfil: PerfilJornada;
  aprendizado: MetricasProgressoConta;
  fatos: FatosJornadaOperacional;
  oportunidadeId: string;
}): PlanoJornada {
  const oportunidade = fatos.oportunidades.find((item) => item.id === oportunidadeId) ?? null;
  const calls = fatos.calls.filter((item) => item.oportunidade_id === oportunidadeId);
  const propostas = fatos.propostas.filter((item) => item.oportunidade_id === oportunidadeId);
  const projetos = fatos.projetos.filter((item) => item.oportunidade_id === oportunidadeId);
  const projetoEmFoco =
    projetos.find((item) => item.status !== 'concluido' && item.status !== 'pausado') ??
    projetos[0] ??
    null;
  const tarefas = projetoEmFoco?.projeto_tarefas ?? [];

  return montarPlanoJornada({
    perfil,
    aprendizado,
    oportunidades: {
      total: oportunidade ? 1 : 0,
      enriquecidas: fatos.enriquecimentos.some(
        (item) => item.oportunidade_id === oportunidadeId && item.status === 'concluido',
      )
        ? 1
        : 0,
      comProximaAcao: oportunidade?.proxima_acao ? 1 : 0,
      ganhas: oportunidade?.etapa === 'ganho' ? 1 : 0,
    },
    calls: {
      descobertasConcluidas: calls.filter(
        (item) => item.tipo === 'descoberta' && item.status === 'concluida',
      ).length,
      kickoffsConcluidos: calls.filter(
        (item) => item.tipo === 'kickoff' && item.status === 'concluida',
      ).length,
      entregasConcluidas: calls.filter(
        (item) => item.tipo === 'entrega' && item.status === 'concluida',
      ).length,
    },
    propostas: {
      total: propostas.length,
      apresentadas: propostas.filter(
        (item) => item.status === 'apresentada' || item.status === 'aceita',
      ).length,
      aceitas: propostas.filter((item) => item.status === 'aceita').length,
    },
    entregas: {
      projetosIniciados: projetos.length,
      projetosConcluidos: projetos.filter((item) => item.status === 'concluido').length,
      propostaAceitaEmFocoId: propostas.find((item) => item.status === 'aceita')?.id ?? null,
      projetoEmFocoId: projetoEmFoco?.id ?? null,
      projetoEmFocoTitulo: projetoEmFoco?.titulo ?? null,
      tarefasConcluidas: tarefas.filter((item) => item.status === 'concluida').length,
      tarefasTotal: tarefas.length,
    },
  });
}

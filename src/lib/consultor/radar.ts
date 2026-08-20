import type { Enums } from '@/lib/supabase/types.generated';
import { ROTULO_ETAPA } from '@/lib/crm/etapas';
import { ROTULO_TIPO_CALL } from '@/lib/calls/tipos';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';

export type DominioRadarSobral = 'crm' | 'calls' | 'propostas' | 'projetos' | 'plano';
export type EstadoRadarSobral =
  'ao_vivo' | 'atrasado' | 'hoje' | 'agendado' | 'aguardando' | 'sem_prazo';

export type ItemRadarSobral = {
  id: string;
  dominio: DominioRadarSobral;
  titulo: string;
  contexto: string;
  momento: string;
  estado: EstadoRadarSobral;
  destino: string;
  prioridade: number;
};

type OportunidadeRadar = {
  id: string;
  empresa_id: string;
  titulo: string;
  etapa: Enums<'crm_etapa'>;
  proxima_acao: string | null;
  proxima_acao_em: string | null;
  atualizado_em: string;
};

type CallRadar = {
  id: string;
  oportunidade_id: string;
  titulo: string;
  tipo: Enums<'calls_tipo'>;
  status: Enums<'calls_status'>;
  agendada_para: string;
};

type PropostaRadar = {
  id: string;
  empresa_id: string;
  titulo: string;
  status: Enums<'proposta_status'>;
  atualizado_em: string;
};

type AcaoProjetoRadar = {
  id: string;
  titulo: string;
  empresa_id: string;
  oportunidade_id: string;
  projeto_execucao_id: string | null;
  reuniao_id: string | null;
  prazo_em: string | null;
  status: Enums<'projeto_acao_status'>;
  atualizado_em: string;
};

type ProjetoRadar = {
  id: string;
  titulo: string;
  status: Enums<'projeto_execucao_status'>;
  prazo_em: string | null;
  atualizado_em: string;
};

export type EntradaRadarSobral = {
  agora: string;
  oportunidades: OportunidadeRadar[];
  calls: CallRadar[];
  propostas: PropostaRadar[];
  projetos: ProjetoRadar[];
  acoes: AcaoProjetoRadar[];
  empresasPorId: ReadonlyMap<string, string>;
};

const FUSO = 'America/Sao_Paulo';
const DIA = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: FUSO,
});
const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: FUSO,
});
const HORA = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: FUSO,
});

function chaveDoDia(iso: string): string {
  return DIA.format(new Date(iso));
}

function prazo(
  iso: string | null,
  agora: string,
): { estado: EstadoRadarSobral; momento: string; bonus: number } {
  if (!iso) return { estado: 'sem_prazo', momento: 'Sem data definida', bonus: 0 };

  const data = new Date(iso);
  const instante = data.getTime();
  const referencia = new Date(agora).getTime();
  const hoje = chaveDoDia(agora) === chaveDoDia(iso);
  const dataCurta = DATA.format(data).replace('.', '');
  const hora = HORA.format(data);

  if (instante < referencia) {
    return {
      estado: 'atrasado',
      momento: hoje ? `Atrasado desde ${hora}` : `Atrasado desde ${dataCurta}`,
      bonus: 42,
    };
  }
  if (hoje) return { estado: 'hoje', momento: `Hoje · ${hora}`, bonus: 34 };
  return { estado: 'agendado', momento: `${dataCurta} · ${hora}`, bonus: 16 };
}

function empresa(empresaId: string, empresasPorId: ReadonlyMap<string, string>): string {
  return empresasPorId.get(empresaId) ?? 'Empresa sem nome disponível';
}

function prioridadeEtapa(etapa: Enums<'crm_etapa'>): number {
  if (etapa === 'negociacao') return 24;
  if (etapa === 'proposta') return 20;
  if (etapa === 'descoberta') return 14;
  if (etapa === 'qualificacao') return 8;
  return 4;
}

/**
 * Monta uma fila curta e determinística. O modelo recebe estes mesmos fatos,
 * mas não decide o que está atrasado nem inventa registros: isso pertence ao
 * relógio e ao banco.
 */
export function montarRadarSobral(entrada: EntradaRadarSobral): ItemRadarSobral[] {
  const { agora, empresasPorId } = entrada;
  const candidatos: ItemRadarSobral[] = [];

  for (const oportunidade of entrada.oportunidades) {
    if (oportunidade.etapa === 'ganho' || oportunidade.etapa === 'perdido') continue;
    const info = prazo(oportunidade.proxima_acao_em, agora);
    const semAcao = !oportunidade.proxima_acao;
    candidatos.push({
      id: `crm-${oportunidade.id}`,
      dominio: 'crm',
      titulo: oportunidade.proxima_acao ?? 'Definir a próxima ação',
      contexto: `${empresa(oportunidade.empresa_id, empresasPorId)} · ${ROTULO_ETAPA[oportunidade.etapa]}`,
      momento: semAcao ? 'Sem próxima ação' : info.momento,
      estado: semAcao ? 'sem_prazo' : info.estado,
      destino: `/vendas/${oportunidade.id}`,
      prioridade: 58 + prioridadeEtapa(oportunidade.etapa) + (semAcao ? 30 : info.bonus),
    });
  }

  const oportunidadesPorId = new Map(
    entrada.oportunidades.map((oportunidade) => [oportunidade.id, oportunidade]),
  );
  for (const call of entrada.calls) {
    if (!['agendada', 'aguardando', 'ao_vivo'].includes(call.status)) continue;
    const oportunidade = oportunidadesPorId.get(call.oportunidade_id);
    const info = prazo(call.agendada_para, agora);
    const aoVivo = call.status === 'ao_vivo' || call.status === 'aguardando';
    candidatos.push({
      id: `calls-${call.id}`,
      dominio: 'calls',
      titulo: call.titulo,
      contexto: `${oportunidade ? empresa(oportunidade.empresa_id, empresasPorId) : 'Reunião vinculada'} · ${ROTULO_TIPO_CALL[call.tipo]}`,
      momento:
        call.status === 'ao_vivo'
          ? 'Ao vivo agora'
          : call.status === 'aguardando'
            ? 'Sala aberta'
            : info.momento,
      estado: aoVivo ? 'ao_vivo' : info.estado,
      destino: `/reunioes/${call.id}`,
      prioridade: aoVivo ? 142 : 66 + info.bonus,
    });
  }

  for (const proposta of entrada.propostas) {
    if (proposta.status === 'aceita' || proposta.status === 'recusada') continue;
    const configuracao = {
      rascunho: { momento: 'Rascunho em aberto', prioridade: 82 },
      pronta: { momento: 'Pronta para apresentar', prioridade: 96 },
      apresentada: { momento: 'Aguardando decisão', prioridade: 106 },
    }[proposta.status];
    candidatos.push({
      id: `propostas-${proposta.id}`,
      dominio: 'propostas',
      titulo: proposta.titulo,
      contexto: empresa(proposta.empresa_id, empresasPorId),
      momento: configuracao.momento,
      estado: proposta.status === 'apresentada' ? 'aguardando' : 'sem_prazo',
      destino: `/propostas/${proposta.id}`,
      prioridade: configuracao.prioridade,
    });
  }

  const projetosPorId = new Map(entrada.projetos.map((projeto) => [projeto.id, projeto]));
  const acoesPendentes = entrada.acoes.filter((acao) => acao.status === 'pendente');
  for (const acao of acoesPendentes) {
    const projeto = acao.projeto_execucao_id
      ? projetosPorId.get(acao.projeto_execucao_id)
      : undefined;
    const oportunidade = oportunidadesPorId.get(acao.oportunidade_id);
    const info = prazo(acao.prazo_em, agora);
    candidatos.push({
      id: `plano-${acao.id}`,
      dominio: projeto ? 'projetos' : 'plano',
      titulo: acao.titulo,
      contexto:
        projeto?.titulo ??
        `${oportunidade ? empresa(oportunidade.empresa_id, empresasPorId) : empresa(acao.empresa_id, empresasPorId)} · compromisso da operação`,
      momento: info.momento,
      estado: info.estado,
      destino: projeto
        ? `/solucoes/execucao/${projeto.id}`
        : acao.reuniao_id
          ? `/reunioes/${acao.reuniao_id}`
          : `/vendas/${acao.oportunidade_id}`,
      prioridade: 64 + info.bonus,
    });
  }

  for (const projeto of entrada.projetos) {
    if (projeto.status === 'concluido' || projeto.status === 'pausado') continue;
    const pendentes = acoesPendentes.filter((acao) => acao.projeto_execucao_id === projeto.id);
    if (pendentes.length === 0) {
      candidatos.push({
        id: `projetos-${projeto.id}`,
        dominio: 'projetos',
        titulo: 'Definir o próximo compromisso',
        contexto: `${projeto.titulo} · ${ROTULO_STATUS_PROJETO[projeto.status]}`,
        momento: 'Plano sem próxima ação',
        estado: 'sem_prazo',
        destino: `/solucoes/execucao/${projeto.id}`,
        prioridade: 74,
      });
    }
  }

  candidatos.sort((a, b) => {
    if (a.prioridade !== b.prioridade) return b.prioridade - a.prioridade;
    return a.titulo.localeCompare(b.titulo, 'pt-BR');
  });

  const escolhidos: ItemRadarSobral[] = [];
  const dominios = new Set<DominioRadarSobral>();
  for (const item of candidatos) {
    if (dominios.has(item.dominio)) continue;
    escolhidos.push(item);
    dominios.add(item.dominio);
    if (escolhidos.length === 4) return escolhidos;
  }
  for (const item of candidatos) {
    if (escolhidos.some((escolhido) => escolhido.id === item.id)) continue;
    escolhidos.push(item);
    if (escolhidos.length === 4) break;
  }
  return escolhidos;
}

export function contarAcoesAtrasadas(acoes: AcaoProjetoRadar[], agora: string): number {
  return acoes.filter(
    (acao) =>
      acao.status === 'pendente' &&
      acao.prazo_em !== null &&
      new Date(acao.prazo_em).getTime() < new Date(agora).getTime(),
  ).length;
}

import 'server-only';

import { cache } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import {
  inicioLeituraMetricas,
  montarMetricasComerciais,
  type MetricasComerciais,
  type PeriodoMetricas,
} from './modelo';

const TAMANHO_PAGINA = 500;

type RespostaPagina<T> = {
  data: T[] | null;
  error: PostgrestError | null;
};

async function listarTudo<T>(
  contexto: string,
  buscar: (inicio: number, fim: number) => Promise<RespostaPagina<T>>,
): Promise<T[]> {
  const acumulado: T[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const resposta = await buscar(inicio, inicio + TAMANHO_PAGINA - 1);
    if (resposta.error) throw handleError(resposta.error, contexto);

    const pagina = resposta.data ?? [];
    acumulado.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) return acumulado;
  }
}

/**
 * Diagnóstico comercial da conta autenticada.
 *
 * As leituras continuam sob RLS. A paginação evita que o limite padrão do
 * PostgREST transforme uma conta com mais de mil registros em um relatório
 * silenciosamente incompleto.
 */
export const carregarMetricasComerciais = cache(
  async (periodo: PeriodoMetricas): Promise<MetricasComerciais> => {
    const supabase = await createClient();
    const agora = new Date();
    const inicioLeitura = inicioLeituraMetricas(periodo, agora);

    const [leads, oportunidades, propostas, calls] = await Promise.all([
      listarTudo('metricas:prospeccao', async (inicio, fim) => {
        let consulta = supabase
          .from('prospeccao_leads')
          .select('criado_em, ultimo_contato_em, tentativas_contato')
          .order('criado_em', { ascending: true });
        if (inicioLeitura) {
          consulta = consulta.or(
            `criado_em.gte.${inicioLeitura},ultimo_contato_em.gte.${inicioLeitura}`,
          );
        }
        return await consulta.range(inicio, fim);
      }),
      listarTudo('metricas:oportunidades', async (inicio, fim) => {
        return await supabase
          .from('crm_oportunidades')
          .select(
            'criado_em, etapa, valor_centavos, proxima_acao, ganha_em, perdida_em, motivo_perda',
          )
          .order('criado_em', { ascending: true })
          .range(inicio, fim);
      }),
      listarTudo('metricas:propostas', async (inicio, fim) => {
        return await supabase
          .from('propostas')
          .select('status, apresentada_em')
          .order('criado_em', { ascending: true })
          .range(inicio, fim);
      }),
      listarTudo('metricas:calls', async (inicio, fim) => {
        let consulta = supabase
          .from('calls_reunioes')
          .select('status, encerrada_em')
          .order('criada_em', { ascending: true });
        if (inicioLeitura) consulta = consulta.gte('encerrada_em', inicioLeitura);
        return await consulta.range(inicio, fim);
      }),
    ]);

    return montarMetricasComerciais(
      {
        leads: leads.map((lead) => ({
          criadoEm: lead.criado_em,
          ultimoContatoEm: lead.ultimo_contato_em,
          tentativasContato: lead.tentativas_contato,
        })),
        oportunidades: oportunidades.map((oportunidade) => ({
          criadoEm: oportunidade.criado_em,
          etapa: oportunidade.etapa,
          valorCentavos: oportunidade.valor_centavos,
          proximaAcao: oportunidade.proxima_acao,
          ganhaEm: oportunidade.ganha_em,
          perdidaEm: oportunidade.perdida_em,
          motivoPerda: oportunidade.motivo_perda,
        })),
        propostas: propostas.map((proposta) => ({
          status: proposta.status,
          apresentadaEm: proposta.apresentada_em,
        })),
        calls: calls.map((call) => ({
          status: call.status,
          encerradaEm: call.encerrada_em,
        })),
      },
      periodo,
      agora,
    );
  },
);

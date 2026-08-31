import type { Tables } from '@/lib/supabase/types.generated';

export type StatusMudancaEscopo =
  'em_analise' | 'incluida' | 'aguardando_cliente' | 'aprovada' | 'recusada' | 'cancelada';

export type MudancaEscopoProjeto = {
  id: string;
  titulo: string;
  descricao: string;
  solicitadoPor: 'cliente' | 'prestador';
  status: StatusMudancaEscopo;
  classificacao: 'dentro_escopo' | 'fora_escopo' | null;
  resposta: string | null;
  impactoPrazoDias: number | null;
  impactoValorCentavos: number | null;
  criadoEm: string;
  analisadoEm: string | null;
  decididoEm: string | null;
};

const STATUS_VALIDOS: StatusMudancaEscopo[] = [
  'em_analise',
  'incluida',
  'aguardando_cliente',
  'aprovada',
  'recusada',
  'cancelada',
];

export function mapearMudancasEscopo(
  mudancas: Tables<'projeto_mudancas_escopo'>[],
): MudancaEscopoProjeto[] {
  return mudancas
    .flatMap((mudanca) => {
      const status = mudanca.status as StatusMudancaEscopo;
      const solicitadoPor = mudanca.solicitado_por as MudancaEscopoProjeto['solicitadoPor'];
      const classificacao = mudanca.classificacao as MudancaEscopoProjeto['classificacao'];
      if (!STATUS_VALIDOS.includes(status) || !['cliente', 'prestador'].includes(solicitadoPor)) {
        return [];
      }
      return [
        {
          id: mudanca.id,
          titulo: mudanca.titulo,
          descricao: mudanca.descricao,
          solicitadoPor,
          status,
          classificacao,
          resposta: mudanca.resposta,
          impactoPrazoDias: mudanca.impacto_prazo_dias,
          impactoValorCentavos: mudanca.impacto_valor_centavos,
          criadoEm: mudanca.criado_em,
          analisadoEm: mudanca.analisado_em,
          decididoEm: mudanca.decidido_em,
        },
      ];
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

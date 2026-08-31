import type { Tables } from '@/lib/supabase/types.generated';
import { prazoEstaAtrasado } from './prazo';

export type AcaoPlanoProjeto = {
  id: string;
  titulo: string;
  prazoEm: string | null;
  status: Tables<'projeto_acoes'>['status'];
  origem: string;
  categoria: 'proxima_acao' | 'compromisso' | 'acesso' | 'dependencia';
  reuniaoId: string | null;
  responsavelTipo: 'cliente' | 'prestador';
  responsavelNome: string | null;
  visivelCliente: boolean;
  concluidaEm: string | null;
  atualizadoEm: string;
};

export type ResumoDependenciasProjeto = {
  dependenciasClientePendentes: number;
  dependenciasPrestadorPendentes: number;
  dependenciasClienteAtrasadas: number;
  dependenciasPrestadorAtrasadas: number;
};

export function mapearAcoesPlano(acoes: Tables<'projeto_acoes'>[]): AcaoPlanoProjeto[] {
  return acoes
    .map((acao) => ({
      id: acao.id,
      titulo: acao.titulo,
      prazoEm: acao.prazo_em,
      status: acao.status,
      origem: acao.origem,
      categoria: acao.categoria as AcaoPlanoProjeto['categoria'],
      reuniaoId: acao.reuniao_id,
      responsavelTipo: acao.responsavel_tipo as AcaoPlanoProjeto['responsavelTipo'],
      responsavelNome: acao.responsavel_nome,
      visivelCliente: acao.visivel_cliente,
      concluidaEm: acao.concluida_em,
      atualizadoEm: acao.atualizado_em,
    }))
    .sort(ordenarAcoesPlano);
}

export function obterProximoCompromisso<T extends Pick<AcaoPlanoProjeto, 'status' | 'categoria'>>(
  acoes: T[],
): T | null {
  return (
    acoes.find(
      (acao) => acao.status === 'pendente' && !['acesso', 'dependencia'].includes(acao.categoria),
    ) ?? null
  );
}

export function contarDependenciasPendentes(acoes: AcaoPlanoProjeto[]): number {
  return acoes.filter(ehDependenciaPendente).length;
}

export function resumirDependencias(
  acoes: AcaoPlanoProjeto[],
  agora = new Date(),
): ResumoDependenciasProjeto {
  const pendentes = acoes.filter(ehDependenciaPendente);
  const cliente = pendentes.filter((acao) => acao.responsavelTipo === 'cliente');
  const prestador = pendentes.filter((acao) => acao.responsavelTipo === 'prestador');
  return {
    dependenciasClientePendentes: cliente.length,
    dependenciasPrestadorPendentes: prestador.length,
    dependenciasClienteAtrasadas: cliente.filter((acao) => prazoEstaAtrasado(acao.prazoEm, agora))
      .length,
    dependenciasPrestadorAtrasadas: prestador.filter((acao) =>
      prazoEstaAtrasado(acao.prazoEm, agora),
    ).length,
  };
}

function ehDependenciaPendente(acao: AcaoPlanoProjeto): boolean {
  return acao.status === 'pendente' && ['acesso', 'dependencia'].includes(acao.categoria);
}

function ordenarAcoesPlano(a: AcaoPlanoProjeto, b: AcaoPlanoProjeto): number {
  if (a.status === 'pendente' && b.status !== 'pendente') return -1;
  if (a.status !== 'pendente' && b.status === 'pendente') return 1;
  if (a.prazoEm && b.prazoEm) return a.prazoEm.localeCompare(b.prazoEm);
  if (a.prazoEm) return -1;
  if (b.prazoEm) return 1;
  return b.atualizadoEm.localeCompare(a.atualizadoEm);
}

import type { MudancaEscopoProjeto } from '@/lib/projetos-execucao/queries';

function quantidade(valor: number, singular: string, plural: string) {
  return `${valor} ${valor === 1 ? singular : plural}`;
}

export function resumirEscopoSala({
  mudancas,
  investimentoBase,
  briefingConfirmado,
  ajustes,
  dependencias,
  validacoes,
  portalAtivo,
}: {
  mudancas: MudancaEscopoProjeto[];
  investimentoBase: number | null;
  briefingConfirmado: boolean;
  ajustes: number;
  dependencias: number;
  validacoes: number;
  portalAtivo: boolean;
}) {
  const adicionais = mudancas
    .filter((mudanca) => mudanca.status === 'aprovada')
    .reduce((total, mudanca) => total + (mudanca.impactoValorCentavos ?? 0), 0);
  const investimentoAtual = investimentoBase === null ? null : investimentoBase + adicionais;

  let rotuloCliente = portalAtivo ? 'Portal ativo' : 'Portal privado';
  if (validacoes) rotuloCliente = quantidade(validacoes, 'validação', 'validações');
  if (dependencias) rotuloCliente = quantidade(dependencias, 'pendência', 'pendências');
  if (ajustes) rotuloCliente = quantidade(ajustes, 'ajuste', 'ajustes');
  if (mudancas.some((mudanca) => mudanca.status === 'aguardando_cliente')) {
    rotuloCliente = 'Mudança com o cliente';
  }
  if (mudancas.some((mudanca) => mudanca.status === 'em_analise')) {
    rotuloCliente = 'Mudança para analisar';
  }
  if (!briefingConfirmado) rotuloCliente = 'Briefing pendente';

  return { investimentoAtual, rotuloCliente };
}

import type { OportunidadeCrm } from './pipeline-queries';
import { etapaAberta, faseDaEtapa } from './etapas';
import { estaNoFluxo } from './situacao';

/** A ação segue o documento existente, sem mudar a etapa escolhida pelo usuário. */
export function acaoDoPipeline(oportunidade: OportunidadeCrm): {
  rotulo: string;
  href: string;
} {
  const ficha = { rotulo: 'Abrir ficha', href: `/vendas/${oportunidade.id}` };
  if (!estaNoFluxo(oportunidade) || oportunidade.etapa === 'perdido') return ficha;
  if (oportunidade.entregaId) {
    return { rotulo: 'Abrir entrega', href: `/entregas/${oportunidade.entregaId}` };
  }
  const proposta = oportunidade.propostaRecente;
  if (proposta) {
    const rotulos = {
      rascunho: 'Continuar proposta',
      pronta: 'Apresentar proposta',
      apresentada: 'Acompanhar proposta',
      aceita: 'Preparar entrega',
      recusada: 'Revisar proposta',
    } as const;
    return { rotulo: rotulos[proposta.status], href: `/propostas/${proposta.id}` };
  }
  if (faseDaEtapa(oportunidade.etapa) === 'proposta') {
    return {
      rotulo: 'Criar proposta',
      href: `/propostas/nova?oportunidade=${oportunidade.id}`,
    };
  }
  return ficha;
}

export function temPropostaNoPipeline(oportunidade: OportunidadeCrm): boolean {
  return Boolean(oportunidade.propostaRecente);
}

export type FiltroPipeline = 'todas' | 'atencao' | 'sem_acao' | 'proposta';

export function precisaDeAtencao(oportunidade: OportunidadeCrm): boolean {
  return (
    etapaAberta(oportunidade.etapa) &&
    (!oportunidade.proximaAcao ||
      Boolean(oportunidade.proximaAcaoEm && Date.parse(oportunidade.proximaAcaoEm) < Date.now()))
  );
}

function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filtrarPipeline(
  itens: OportunidadeCrm[],
  filtro: FiltroPipeline,
  busca: string,
): OportunidadeCrm[] {
  const termo = normalizarBusca(busca);
  return itens.filter((item) => {
    const corresponde =
      filtro === 'todas' ||
      (filtro === 'atencao' && precisaDeAtencao(item)) ||
      (filtro === 'sem_acao' && etapaAberta(item.etapa) && !item.proximaAcao) ||
      (filtro === 'proposta' && etapaAberta(item.etapa) && temPropostaNoPipeline(item));
    return (
      corresponde &&
      (!termo ||
        normalizarBusca(
          [item.empresa, item.titulo, item.contato].filter(Boolean).join(' '),
        ).includes(termo))
    );
  });
}

/** Remove só o nome já exibido, nunca termos do projeto nem o título salvo. */
export function tituloDoProjetoNoCard(titulo: string, empresa: string): string {
  const partes = titulo.split(/\s+[·—–-]\s+/);
  if (partes.length < 2) return titulo;
  if (
    partes.at(-1)?.trim().toLocaleLowerCase('pt-BR') !== empresa.trim().toLocaleLowerCase('pt-BR')
  ) {
    return titulo;
  }
  return partes.slice(0, -1).join(' · ');
}

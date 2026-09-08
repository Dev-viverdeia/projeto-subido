import { describe, expect, it } from 'vitest';
import { acaoDoPipeline, temPropostaNoPipeline, tituloDoProjetoNoCard } from './acao-pipeline';
import type { OportunidadeCrm } from './pipeline-queries';

export const OPORTUNIDADE_TESTE: OportunidadeCrm = {
  id: 'venda-1',
  titulo: 'Atendimento com IA · Clínica Aurora',
  etapa: 'descoberta',
  empresaId: 'empresa-1',
  empresa: 'Clínica Aurora',
  dominio: null,
  enriquecidoEm: null,
  enriquecimentoStatus: null,
  contatoId: null,
  contato: null,
  contatoEmail: null,
  valorCentavos: 1200000,
  proximaAcao: 'Finalizar proposta',
  proximaAcaoEm: null,
  ganhaEm: null,
  perdidaEm: null,
  motivoPerda: null,
  ultimoFato: null,
  ultimoFatoEm: null,
  atualizadoEm: '2026-09-08T12:00:00Z',
  criadoEm: '2026-09-01T12:00:00Z',
};

describe('Ação do quadro de vendas', () => {
  it.each([
    ['rascunho', 'Continuar proposta'],
    ['pronta', 'Apresentar proposta'],
    ['apresentada', 'Acompanhar proposta'],
    ['aceita', 'Preparar entrega'],
    ['recusada', 'Revisar proposta'],
  ] as const)('abre a proposta %s sem exigir reunião ou mudança de etapa', (status, rotulo) => {
    expect(
      acaoDoPipeline({ ...OPORTUNIDADE_TESTE, propostaRecente: { id: 'proposta-1', status } }),
    ).toEqual({ rotulo, href: '/propostas/proposta-1' });
  });

  it('prioriza a entrega já criada e mantém retiradas no histórico', () => {
    const venda = { ...OPORTUNIDADE_TESTE, entregaId: 'entrega-1' };
    expect(acaoDoPipeline(venda).href).toBe('/entregas/entrega-1');
    expect(acaoDoPipeline({ ...venda, situacao: 'arquivada' }).href).toBe('/vendas/venda-1');
    expect(acaoDoPipeline({ ...venda, etapa: 'perdido' }).href).toBe('/vendas/venda-1');
  });

  it('oferece criar proposta sem reunião e não confunde a etapa com documento existente', () => {
    const venda = { ...OPORTUNIDADE_TESTE, etapa: 'proposta' as const };
    expect(temPropostaNoPipeline(venda)).toBe(false);
    expect(acaoDoPipeline(venda)).toEqual({
      rotulo: 'Criar proposta',
      href: '/propostas/nova?oportunidade=venda-1',
    });
    expect(
      temPropostaNoPipeline({
        ...OPORTUNIDADE_TESTE,
        propostaRecente: { id: 'p', status: 'rascunho' },
      }),
    ).toBe(true);
  });

  it('não promete executar enriquecimento ao apenas abrir a ficha', () => {
    expect(acaoDoPipeline({ ...OPORTUNIDADE_TESTE, etapa: 'novo_lead' })).toEqual({
      rotulo: 'Abrir ficha',
      href: '/vendas/venda-1',
    });
  });
});

describe('Título curto sem mudar os dados salvos', () => {
  it('retira somente a repetição exata da empresa ao final', () => {
    expect(tituloDoProjetoNoCard(OPORTUNIDADE_TESTE.titulo, 'Clínica Aurora')).toBe(
      'Atendimento com IA',
    );
    expect(tituloDoProjetoNoCard('Aurora — Atendimento', 'Clínica Aurora')).toBe(
      'Aurora — Atendimento',
    );
    expect(tituloDoProjetoNoCard('IA · CRM · Clínica Aurora', 'Clínica Aurora')).toBe('IA · CRM');
    expect(tituloDoProjetoNoCard('Sem separador', 'Sem separador')).toBe('Sem separador');
  });
});

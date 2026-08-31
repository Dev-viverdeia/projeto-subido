import { describe, expect, it } from 'vitest';
import type { ResumoProjetoExecucao } from './queries';
import { classificarPrioridadeEntrega, ordenarEntregasPorPrioridade } from './prioridade';

const AGORA = new Date('2026-08-28T12:00:00.000Z');
const BASE: ResumoProjetoExecucao = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Atendimento com IA',
  empresa: 'Clínica Horizonte',
  status: 'em_execucao',
  prazoEm: '2026-09-18T12:00:00.000Z',
  atualizadoEm: '2026-08-26T12:00:00.000Z',
  feitas: 4,
  total: 10,
  proximaTarefa: 'Validar o fluxo',
  proximaAcaoPrazoEm: null,
  tarefasBloqueadas: 0,
  validacoesAguardando: 0,
  ajustesSolicitados: 0,
  mudancasEscopoParaAnalisar: 0,
  mudancasEscopoAguardandoCliente: 0,
};

describe('prioridade das entregas', () => {
  it('coloca ajuste do cliente antes de bloqueio e prazo vencido', () => {
    const ajuste = { ...BASE, id: 'ajuste', ajustesSolicitados: 1 };
    const bloqueio = { ...BASE, id: 'bloqueio', tarefasBloqueadas: 1 };
    const atraso = { ...BASE, id: 'atraso', proximaAcaoPrazoEm: '2026-08-26T12:00:00.000Z' };

    expect(
      ordenarEntregasPorPrioridade([atraso, bloqueio, ajuste], AGORA).map(({ id }) => id),
    ).toEqual(['ajuste', 'bloqueio', 'atraso']);
  });

  it('coloca um pedido de mudança de escopo antes da correção de uma entrega', () => {
    const mudanca = { ...BASE, id: 'mudanca', mudancasEscopoParaAnalisar: 1 };
    const ajuste = { ...BASE, id: 'ajuste', ajustesSolicitados: 1 };

    expect(ordenarEntregasPorPrioridade([ajuste, mudanca], AGORA).map(({ id }) => id)).toEqual([
      'mudanca',
      'ajuste',
    ]);
    expect(classificarPrioridadeEntrega(mudanca, AGORA)).toMatchObject({
      tipo: 'mudanca_escopo',
      grupo: 'acao',
      rotulo: 'Mudança para analisar',
    });
  });

  it('explica o fato que tornou a entrega prioritária', () => {
    expect(
      classificarPrioridadeEntrega(
        { ...BASE, proximaAcaoPrazoEm: '2026-08-27T12:00:00.000Z' },
        AGORA,
      ),
    ).toMatchObject({
      tipo: 'atrasada',
      rotulo: 'Próxima ação atrasada',
      detalhe: 'Atraso de 1 dia',
    });
  });

  it('separa o que está com o cliente do que exige trabalho do prestador', () => {
    expect(classificarPrioridadeEntrega({ ...BASE, validacoesAguardando: 2 }, AGORA)).toMatchObject(
      {
        tipo: 'aguardando_cliente',
        grupo: 'cliente',
        detalhe: '2 validações pendentes',
      },
    );
  });

  it('trata preparação atrasada do prestador como trabalho imediato', () => {
    expect(
      classificarPrioridadeEntrega({ ...BASE, dependenciasPrestadorAtrasadas: 2 }, AGORA),
    ).toMatchObject({
      tipo: 'atrasada',
      grupo: 'acao',
      rotulo: 'Preparação atrasada',
      detalhe: '2 pendências com você',
    });
  });

  it('mostra quando a preparação ainda depende do cliente', () => {
    expect(
      classificarPrioridadeEntrega({ ...BASE, dependenciasClientePendentes: 1 }, AGORA),
    ).toMatchObject({
      tipo: 'aguardando_cliente',
      grupo: 'cliente',
      detalhe: '1 pendência de preparação',
    });
  });

  it('prioriza a causa operacional em vez do prazo geral do projeto', () => {
    expect(
      classificarPrioridadeEntrega(
        {
          ...BASE,
          prazoEm: '2026-08-20T12:00:00.000Z',
          dependenciasClientePendentes: 1,
          dependenciasClienteAtrasadas: 1,
        },
        AGORA,
      ),
    ).toMatchObject({
      tipo: 'aguardando_cliente',
      rotulo: 'Pendência vencida com o cliente',
    });
  });

  it('mantém a preparação do prestador visível mesmo antes do prazo', () => {
    expect(
      classificarPrioridadeEntrega({ ...BASE, dependenciasPrestadorPendentes: 1 }, AGORA),
    ).toMatchObject({
      tipo: 'preparacao',
      grupo: 'acao',
      rotulo: 'Preparação com você',
    });
  });
});

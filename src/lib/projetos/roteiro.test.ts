import { describe, expect, it } from 'vitest';
import { idPassoProjeto, idsPassosProjeto, lerRoteiroProjeto } from './roteiro';

const ids = ['entender', 'preparar', 'construir', 'validar', 'entregar'] as const;

function roteiroValido() {
  return {
    fases: ids.map((id) => ({
      id,
      titulo: id[0]!.toUpperCase() + id.slice(1),
      objetivo: `Objetivo suficientemente detalhado para a fase ${id}.`,
      passos: [
        {
          id: `passo-${id}`,
          titulo: `Executar ${id}`,
          acao: `Realize uma ação verificável e detalhada durante a fase ${id}.`,
          concluidoQuando: 'Existe uma evidência objetiva e revisada pelo cliente.',
          entregavel: `Entrega da fase ${id}`,
        },
      ],
    })),
  };
}

describe('roteiro de Projeto', () => {
  it('aceita as cinco fases na ordem do método', () => {
    const roteiro = lerRoteiroProjeto(roteiroValido());
    expect(roteiro?.fases.map((fase) => fase.id)).toEqual(ids);
    expect(roteiro?.fundamentos).toEqual([]);
  });

  it('aceita guia aprofundado sem tornar o novo conteúdo obrigatório nos projetos antigos', () => {
    const valor = roteiroValido();
    Object.assign(valor, {
      fundamentos: [
        {
          titulo: 'Automatize com limite',
          descricao:
            'A IA responde somente a partir da base aprovada e transfere situações de risco.',
        },
      ],
    });
    Object.assign(valor.fases[0]!.passos[0]!, {
      duracao: '45–60 min',
      insumos: ['Conversas reais do atendimento'],
      execucao: ['Exporte uma amostra representativa das conversas do canal.'],
      atencao: 'Não use uma semana atípica como retrato definitivo da operação.',
      modelo: {
        titulo: 'Planilha de demanda',
        conteudo: 'Data | horário | assunto | tempo de primeira resposta | desfecho',
      },
    });

    const roteiro = lerRoteiroProjeto(valor);
    expect(roteiro?.fundamentos).toHaveLength(1);
    expect(roteiro?.fases[0]?.passos[0]?.execucao).toHaveLength(1);
    expect(roteiro?.fases[1]?.passos[0]?.execucao).toEqual([]);
  });

  it('rejeita roteiro com fase fora de ordem sem derrubar a página', () => {
    const invalido = roteiroValido();
    [invalido.fases[0], invalido.fases[1]] = [invalido.fases[1]!, invalido.fases[0]!];
    expect(lerRoteiroProjeto(invalido)).toBeNull();
  });

  it('gera ids estáveis de progresso a partir da identidade editorial', () => {
    const roteiro = lerRoteiroProjeto(roteiroValido());
    expect(roteiro).not.toBeNull();
    expect(idPassoProjeto('crm-comercial', 'entender', 'mapear-jornada')).toBe(
      'projeto:crm-comercial:entender:mapear-jornada',
    );
    expect(idsPassosProjeto('crm-comercial', roteiro!)).toHaveLength(5);
  });
});

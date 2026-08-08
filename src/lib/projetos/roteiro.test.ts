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

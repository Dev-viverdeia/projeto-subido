import { describe, expect, it } from 'vitest';
import type { Tables } from '@/lib/supabase/types.generated';
import { formatarGarantia, mapearEncerramentoProjeto } from './encerramento';

const LINHA: Tables<'projeto_encerramentos'> = {
  id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  dono: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  projeto_execucao_id: '11111111-1111-4111-8111-111111111111',
  status: 'aguardando_aceite',
  resumo_entrega: 'Atendimento configurado, testado e entregue.',
  resultado_principal: 'Primeira resposta validada em menos de um minuto.',
  evidencia_resultado_url: 'https://example.com/resultado',
  garantia_dias: 30,
  garantia_cobre: 'Correções do fluxo entregue.',
  garantia_nao_cobre: 'Novas funcionalidades.',
  canal_suporte: 'suporte@exemplo.com',
  responsavel_continuidade: 'Camila Rios',
  orientacao_continuidade: 'Acompanhar as transferências e registrar qualquer desvio.',
  enviado_em: '2026-08-10T17:10:00.000Z',
  aceito_em: null,
  garantia_termina_em: null,
  criado_em: '2026-08-10T16:00:00.000Z',
  atualizado_em: '2026-08-10T17:10:00.000Z',
};

describe('encerramento do projeto', () => {
  it('mantém resultado, garantia e continuidade em um contrato legível pela interface', () => {
    const encerramento = mapearEncerramentoProjeto(LINHA);

    expect(encerramento).toMatchObject({
      status: 'aguardando_aceite',
      resultadoPrincipal: LINHA.resultado_principal,
      responsavelContinuidade: 'Camila Rios',
    });
    expect(encerramento && formatarGarantia(encerramento)).toBe('30 dias a partir do aceite final');
  });

  it('mostra a data final somente depois que a garantia começou', () => {
    const encerramento = mapearEncerramentoProjeto({
      ...LINHA,
      status: 'encerrado',
      aceito_em: '2026-08-10T18:20:00.000Z',
      garantia_termina_em: '2026-09-09T18:20:00.000Z',
    });

    expect(encerramento && formatarGarantia(encerramento)).toMatch(/09 de setembro de 2026/i);
  });
});

import { describe, expect, it } from 'vitest';
import {
  PACOTES_CREDITOS,
  planoDosMetadados,
  planoPodeAcessarRota,
  planoTemRecurso,
} from './acessos';

describe('permissões dos planos', () => {
  it('mantém formação, reuniões e Live Coach no Starter', () => {
    expect(planoTemRecurso('starter', 'aprendizado')).toBe(true);
    expect(planoTemRecurso('starter', 'reunioes')).toBe(true);
    expect(planoTemRecurso('starter', 'live_coach')).toBe(true);
  });

  it('remove operação comercial e enriquecimento do Starter', () => {
    expect(planoTemRecurso('starter', 'modulo_comercial')).toBe(false);
    expect(planoTemRecurso('starter', 'enriquecimento')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/vendas/cliente')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/crm/cliente')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/propostas')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/reunioes')).toBe(true);
  });

  it('preserva contas antigas como Pro quando não há plano explícito', () => {
    expect(planoDosMetadados(undefined)).toBe('pro');
    expect(planoDosMetadados({ plano_subido: 'desconhecido' })).toBe('pro');
    expect(planoDosMetadados({ plano_subido: 'starter' })).toBe('starter');
    expect(planoDosMetadados({ plano_subido: 'enterprise' })).toBe('enterprise');
  });

  it('oferece apenas pacotes fechados de créditos', () => {
    expect(PACOTES_CREDITOS.map((pacote) => pacote.creditos)).toEqual([50, 150, 500]);
  });
});

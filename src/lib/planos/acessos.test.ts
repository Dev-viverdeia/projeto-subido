import { describe, expect, it } from 'vitest';
import {
  PACOTES_CREDITOS,
  planoDosMetadados,
  planoPodeAcessarRota,
  planoTemRecurso,
  destinoDeUpgrade,
  nomeDaAreaComercial,
  nomeDaAreaBloqueada,
  recursoDaRota,
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
    expect(planoTemRecurso('starter', 'estudio')).toBe(false);
    expect(planoTemRecurso('starter', 'prospeccao')).toBe(false);
    expect(planoTemRecurso('starter', 'vendas')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/vendas/cliente')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/crm/cliente')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/propostas')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/builder')).toBe(false);
    expect(planoPodeAcessarRota('starter', '/reunioes')).toBe(true);
    expect(planoPodeAcessarRota('starter', '/entregas/cliente')).toBe(true);
  });

  it('mapeia cada rota para a permissão específica', () => {
    expect(recursoDaRota('/prospeccao/lista')).toBe('prospeccao');
    expect(recursoDaRota('/crm/cliente')).toBe('vendas');
    expect(recursoDaRota('/builder')).toBe('estudio');
    expect(recursoDaRota('/entregas/cliente')).toBe('projetos');
    expect(recursoDaRota('/inicio')).toBeNull();
    expect(nomeDaAreaBloqueada('/builder')).toBe('Estúdio');
    expect(destinoDeUpgrade('estudio', '/builder')).toBe(
      '/conta/assinatura?upgrade=estudio&origem=%2Fbuilder',
    );
  });

  it('reserva a gestão de equipe para o Enterprise', () => {
    expect(planoTemRecurso('pro', 'gestao_equipe')).toBe(false);
    expect(planoTemRecurso('enterprise', 'gestao_equipe')).toBe(true);
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

  it('explica a área bloqueada sem depender do texto da navegação', () => {
    expect(nomeDaAreaComercial('/metricas')).toBe('Métricas');
    expect(nomeDaAreaComercial('/vendas/cliente')).toBe('Vendas');
    expect(nomeDaAreaComercial('/reunioes')).toBeNull();
  });
});

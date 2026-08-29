import { describe, expect, it } from 'vitest';
import { montarGuiaValidacaoTarefa, validarAtualizacaoTarefa } from './validacao-tarefa';

describe('validação operacional da tarefa', () => {
  it('transforma o critério e o entregável em instruções concretas', () => {
    expect(
      montarGuiaValidacaoTarefa({
        concluidoQuando: 'As dez respostas têm fonte e aprovação do cliente.',
        entregavel: 'Base de conhecimento versionada.',
      }),
    ).toEqual({
      criterio: 'As dez respostas têm fonte e aprovação do cliente.',
      material: 'Base de conhecimento versionada.',
      orientacaoRegistro:
        'Registre o teste realizado, o resultado observado e onde encontrar o material “Base de conhecimento versionada”.',
      mensagemCliente:
        'Concluímos esta etapa.\n\nMaterial entregue: Base de conhecimento versionada.\n\nPara validar, confira este critério: As dez respostas têm fonte e aprovação do cliente.',
    });
  });

  it('só conclui quando há resultado registrado e critério confirmado', () => {
    expect(
      validarAtualizacaoTarefa({
        status: 'concluida',
        registro: '',
        criterioConfirmado: false,
      }),
    ).toBe('Registre como você testou o resultado antes de concluir.');
    expect(
      validarAtualizacaoTarefa({
        status: 'concluida',
        registro: 'Dez respostas revisadas com a responsável.',
        criterioConfirmado: false,
      }),
    ).toBe('Confirme que o resultado atende ao critério desta tarefa.');
    expect(
      validarAtualizacaoTarefa({
        status: 'concluida',
        registro: 'Dez respostas revisadas com a responsável.',
        criterioConfirmado: true,
      }),
    ).toBeNull();
  });

  it('mantém andamento livre e exige descrição apenas para bloqueios', () => {
    expect(
      validarAtualizacaoTarefa({
        status: 'em_andamento',
        registro: '',
        criterioConfirmado: false,
      }),
    ).toBeNull();
    expect(
      validarAtualizacaoTarefa({
        status: 'bloqueada',
        registro: '',
        criterioConfirmado: false,
      }),
    ).toBe('Descreva o bloqueio para saber como retomar.');
  });
});

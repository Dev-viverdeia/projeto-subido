import { describe, expect, it } from 'vitest';
import type { BriefingKickoff } from './briefing';
import { montarDependenciasDoBriefing } from './dependencias';

const BRIEFING: BriefingKickoff = {
  objetivo: 'Organizar o atendimento.',
  criterioSucesso: 'Responder em um minuto.',
  responsavelCliente: 'Camila Rios',
  responsavelTecnico: 'Mateus Silva',
  acessos: ['WhatsApp Business', 'Agenda da recepção'],
  limites: ['Não responder dúvidas clínicas'],
  proximosPassos: [
    'Cliente aprova as respostas principais',
    'Implementador desenha o primeiro fluxo',
  ],
  observacoes: '',
  confirmadoEm: '2026-08-30T12:00:00.000Z',
  fonteCallId: null,
};

describe('montarDependenciasDoBriefing', () => {
  it('transforma acessos e próximos passos em uma lista com dono e visibilidade', () => {
    const dependencias = montarDependenciasDoBriefing(BRIEFING);

    expect(dependencias).toHaveLength(4);
    expect(dependencias[0]).toMatchObject({
      titulo: 'WhatsApp Business',
      categoria: 'acesso',
      responsavelTipo: 'cliente',
      responsavelNome: 'Camila Rios',
      visivelCliente: true,
    });
    expect(dependencias[2]).toMatchObject({
      responsavelTipo: 'cliente',
      visivelCliente: true,
    });
    expect(dependencias[3]).toMatchObject({
      responsavelTipo: 'prestador',
      responsavelNome: 'Mateus Silva',
      visivelCliente: false,
    });
  });

  it('mantém uma única pendência quando o mesmo acesso se repete', () => {
    const dependencias = montarDependenciasDoBriefing({
      ...BRIEFING,
      acessos: ['WhatsApp Business', 'WhatsApp Business'],
      proximosPassos: [],
    });

    expect(dependencias).toHaveLength(1);
  });
});

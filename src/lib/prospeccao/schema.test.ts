import { describe, expect, it } from 'vitest';
import { BuscaProspeccaoSchema, separarTermos } from './schema';

describe('briefing da prospecção', () => {
  it('aceita um recorte pequeno e converte os controles do formulário', () => {
    const resultado = BuscaProspeccaoSchema.parse({
      segmento: 'Clínicas odontológicas',
      localizacao: 'Belo Horizonte, MG',
      termos: 'WhatsApp, agendamento',
      quantidade: '10',
      somenteComSite: 'on',
    });

    expect(resultado.quantidade).toBe(10);
    expect(resultado.somenteComSite).toBe(true);
  });

  it('rejeita quantidades fora das opções que aparecem na interface', () => {
    expect(
      BuscaProspeccaoSchema.safeParse({
        segmento: 'Clínicas',
        localizacao: 'São Paulo',
        termos: '',
        quantidade: '50',
        somenteComSite: false,
      }).success,
    ).toBe(false);
  });

  it('normaliza termos repetidos sem criar filtros invisíveis', () => {
    expect(separarTermos('WhatsApp, agenda, WhatsApp,  atendimento ')).toEqual([
      'WhatsApp',
      'agenda',
      'atendimento',
    ]);
  });
});

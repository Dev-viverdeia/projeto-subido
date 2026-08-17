import { describe, expect, it } from 'vitest';
import { BuscaProspeccaoSchema } from './schema';

describe('briefing da prospecção', () => {
  it('aceita um recorte pequeno e converte os controles do formulário', () => {
    const resultado = BuscaProspeccaoSchema.parse({
      segmento: 'Clínicas odontológicas',
      localizacao: 'Belo Horizonte, MG',
      quantidade: '10',
    });

    expect(resultado.quantidade).toBe(10);
    expect(resultado).toEqual({
      segmento: 'Clínicas odontológicas',
      localizacao: 'Belo Horizonte, MG',
      quantidade: 10,
    });
  });

  it('rejeita quantidades fora das opções que aparecem na interface', () => {
    expect(
      BuscaProspeccaoSchema.safeParse({
        segmento: 'Clínicas',
        localizacao: 'São Paulo',
        quantidade: '50',
      }).success,
    ).toBe(false);
  });
});

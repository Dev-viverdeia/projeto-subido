import { describe, expect, it } from 'vitest';
import { subtituloVisivel } from './apresentacao';

describe('apresentação da proposta', () => {
  it('remove a repetição automática da capa', () => {
    expect(subtituloVisivel('Proposta · Atendimento com IA', 'Atendimento com IA')).toBeNull();
  });

  it('preserva um título específico escrito pelo profissional', () => {
    expect(subtituloVisivel('Piloto da unidade Jardins', 'Atendimento com IA')).toBe(
      'Piloto da unidade Jardins',
    );
  });
});

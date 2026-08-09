import { describe, expect, it } from 'vitest';
import { chaveDoDia, horaCurta, rotuloDoDia } from './estadoMentoria';

describe('datas da agenda no fuso do produto', () => {
  it('mantém dia e hora de São Paulo independentemente do fuso do servidor', () => {
    const sessao = '2026-08-10T00:30:00.000Z';

    expect(chaveDoDia(sessao)).toBe('2026-08-09');
    expect(horaCurta(sessao)).toBe('21:30');
  });

  it('calcula hoje e amanhã pelo calendário de São Paulo', () => {
    const agora = new Date('2026-08-09T23:30:00.000Z');

    expect(rotuloDoDia('2026-08-10T00:30:00.000Z', agora).principal).toBe('Hoje');
    expect(rotuloDoDia('2026-08-10T15:00:00.000Z', agora).principal).toBe('Amanhã');
  });
});

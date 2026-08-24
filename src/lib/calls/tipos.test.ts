import { describe, expect, it } from 'vitest';
import { callPassouDaJanela, fimDaJanelaDaCall } from './tipos';

describe('janela temporal da reunião', () => {
  it('mantém a reunião ativa durante a duração e a margem final da sala', () => {
    const reuniao = {
      status: 'agendada' as const,
      agendadaPara: '2026-08-24T15:00:00.000Z',
      duracaoMinutos: 45,
    };

    expect(callPassouDaJanela(reuniao, new Date('2026-08-24T16:44:59.000Z'))).toBe(false);
    expect(callPassouDaJanela(reuniao, new Date('2026-08-24T16:45:01.000Z'))).toBe(true);
  });

  it('não transforma reuniões concluídas ou datas inválidas em pendência', () => {
    expect(
      callPassouDaJanela(
        { status: 'concluida', agendadaPara: '2026-08-20T15:00:00.000Z', duracaoMinutos: 45 },
        new Date('2026-08-24T15:00:00.000Z'),
      ),
    ).toBe(false);
    expect(fimDaJanelaDaCall('data-inválida', 45)).toBeNull();
  });
});

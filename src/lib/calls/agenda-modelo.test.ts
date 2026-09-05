import { describe, expect, it } from 'vitest';
import { dataLocalParaUtc, podeAlterarHorario, sincronizacaoEmAndamento } from './agenda-modelo';

describe('regras de alteração de agenda', () => {
  it('converte o horário escolhido com o deslocamento da data, não do servidor', () => {
    expect(dataLocalParaUtc('2026-09-10T15:30', 180)?.toISOString()).toBe(
      '2026-09-10T18:30:00.000Z',
    );
    expect(dataLocalParaUtc('2026-09-10T15:30', -330)?.toISOString()).toBe(
      '2026-09-10T10:00:00.000Z',
    );
  });
  it.each(['2026-02-30T12:00', '2026-13-01T12:00', '2026-09-10T24:00', 'texto'])(
    'rejeita data impossível %s',
    (data) => {
      expect(dataLocalParaUtc(data, 180)).toBeNull();
    },
  );
  it('impede reagendamento de reunião iniciada, concluída ou cancelada', () => {
    expect(podeAlterarHorario('agendada')).toBe(true);
    expect(podeAlterarHorario('aguardando')).toBe(true);
    for (const status of ['ao_vivo', 'concluida', 'cancelada', 'processando']) {
      expect(podeAlterarHorario(status)).toBe(false);
    }
  });
  it('libera a recuperação de uma sincronização interrompida sem permitir concorrência imediata', () => {
    const agora = new Date('2026-09-10T12:00:00Z');
    expect(sincronizacaoEmAndamento('sincronizando', '2026-09-10T11:59:50Z', agora)).toBe(true);
    expect(sincronizacaoEmAndamento('sincronizando', '2026-09-10T11:55:00Z', agora)).toBe(false);
    expect(sincronizacaoEmAndamento('falhou', '2026-09-10T11:59:50Z', agora)).toBe(false);
  });
});

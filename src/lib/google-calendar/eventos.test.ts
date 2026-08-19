import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { idEventoGoogle, montarEventoGoogle, type DadosEventoCall } from './eventos';

const DADOS: DadosEventoCall = {
  reuniaoId: '22222222-2222-4222-8222-222222222222',
  codigoPublico: '33333333-3333-4333-8333-333333333333',
  titulo: 'Descoberta do atendimento',
  empresa: 'Clínica Aurora',
  contato: 'Camila Rios',
  convidadoEmail: 'camila@clinicaaurora.com.br',
  agendadaPara: '2026-08-20T18:00:00.000Z',
  duracaoMinutos: 45,
};

describe('evento do Google Calendar', () => {
  it('usa um identificador determinístico para não duplicar a call', () => {
    expect(idEventoGoogle(DADOS.reuniaoId)).toBe('subido22222222222242228222222222222222');
  });

  it('leva o convidado para a sala pública da Subido sem criar Google Meet', () => {
    const sala = 'https://projeto-subido.vercel.app/sala/33333333-3333-4333-8333-333333333333';
    const evento = montarEventoGoogle(DADOS, sala);

    expect(evento.location).toBe(sala);
    expect(evento.source).toEqual({ title: 'Abrir sala na Subido', url: sala });
    expect(evento.attendees).toEqual([{ email: DADOS.convidadoEmail }]);
    expect(evento.end.dateTime).toBe('2026-08-20T18:45:00.000Z');
    expect(evento).not.toHaveProperty('conferenceData');
    expect(evento.description).toContain(sala);
  });
});

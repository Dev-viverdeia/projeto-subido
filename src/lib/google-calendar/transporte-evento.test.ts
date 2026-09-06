import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { aplicarEventoGoogle } from './transporte-evento';

const ID = 'subido22222222222242228222222222222222';
const DADOS = {
  reuniaoId: '22222222-2222-4222-8222-222222222222',
  codigoPublico: '33333333-3333-4333-8333-333333333333',
  titulo: 'Reunião com o cliente',
  empresa: 'Empresa teste',
  contato: 'Ana',
  convidadoEmail: 'ana@example.com',
  agendadaPara: '2026-09-10T18:00:00Z',
  duracaoMinutos: 30,
};
const OPCOES = {
  token: 'token-de-teste',
  calendarId: 'dono@example.com',
  eventoId: ID,
  dados: DADOS,
  salaUrl: 'https://subido.viverdeia.ai/sala/teste',
  cancelar: false,
};
const existente = {
  id: ID,
  etag: '"v1"',
  status: 'confirmed',
  htmlLink: 'https://calendar.google.com/event',
  start: { dateTime: '2026-09-10T14:00:00-03:00' },
  end: { dateTime: '2026-09-10T14:30:00-03:00' },
  extendedProperties: { private: { subido_reuniao_id: DADOS.reuniaoId } },
};

afterEach(() => vi.unstubAllGlobals());

describe('alteração do mesmo evento Google', () => {
  it('reagenda sem recriar o evento nem substituir convidados e avisa todos', async () => {
    await Promise.resolve();
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      await Promise.resolve();
      requests.push({ url, init });
      return Response.json(requests.length === 1 ? existente : { ...existente, etag: '"v2"' });
    });
    const resultado = await aplicarEventoGoogle(OPCOES);
    expect(resultado.eventoId).toBe(ID);
    expect(requests).toHaveLength(2);
    expect(requests[1]?.init?.method).toBe('PATCH');
    expect(requests[1]?.url).toContain(`${ID}?sendUpdates=all`);
    expect(new Headers(requests[1]?.init?.headers).get('if-match')).toBe('"v1"');
    expect(JSON.parse(requests[1]?.init?.body as string)).toEqual({
      start: { dateTime: '2026-09-10T18:00:00.000Z' },
      end: { dateTime: '2026-09-10T18:30:00.000Z' },
    });
  });

  it('não envia uma segunda atualização quando o novo horário já foi aplicado', async () => {
    await Promise.resolve();
    const fetchGoogle = vi.fn(async () => {
      await Promise.resolve();
      return Response.json({
        ...existente,
        start: { dateTime: '2026-09-10T15:00:00-03:00' },
        end: { dateTime: '2026-09-10T15:30:00-03:00' },
      });
    });
    vi.stubGlobal('fetch', fetchGoogle);
    expect((await aplicarEventoGoogle(OPCOES)).removido).toBe(false);
    expect(fetchGoogle).toHaveBeenCalledTimes(1);
  });

  it('cancela avisando os convidados e aceita repetição do cancelamento', async () => {
    await Promise.resolve();
    const requests: RequestInit[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      await Promise.resolve();
      requests.push(init);
      return requests.length === 1 ? Response.json(existente) : new Response(null, { status: 410 });
    });
    expect((await aplicarEventoGoogle({ ...OPCOES, cancelar: true })).removido).toBe(true);
    expect(requests[1]?.method).toBe('DELETE');
  });

  it('não ressuscita um evento que foi excluído diretamente no Google', async () => {
    await Promise.resolve();
    vi.stubGlobal('fetch', async () => {
      await Promise.resolve();
      return Response.json({ ...existente, status: 'cancelled' });
    });
    await expect(aplicarEventoGoogle(OPCOES)).rejects.toThrow('removido');
  });

  it('não altera um evento sem o vínculo desta reunião', async () => {
    await Promise.resolve();
    vi.stubGlobal('fetch', async () => {
      await Promise.resolve();
      return Response.json({
        ...existente,
        extendedProperties: { private: { subido_reuniao_id: 'outra-reuniao' } },
      });
    });
    await expect(aplicarEventoGoogle(OPCOES)).rejects.toThrow('vínculo');
  });

  it('não recria evento conhecido ausente, nem confirma cancelamento na agenda legada incerta', async () => {
    await Promise.resolve();
    const fetchGoogle = vi.fn(async () => {
      await Promise.resolve();
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal('fetch', fetchGoogle);
    await expect(aplicarEventoGoogle({ ...OPCOES, permitirCriacao: false })).rejects.toThrow(
      'removido',
    );
    await expect(
      aplicarEventoGoogle({ ...OPCOES, calendarId: 'primary', cancelar: true }),
    ).rejects.toThrow('agenda original');
    expect(fetchGoogle).toHaveBeenCalledTimes(2);
  });

  it('usa o ID estável ao recuperar uma criação que não chegou ao Google', async () => {
    await Promise.resolve();
    const requests: RequestInit[] = [];
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      await Promise.resolve();
      requests.push(init);
      return requests.length === 1 ? new Response(null, { status: 404 }) : Response.json(existente);
    });
    expect((await aplicarEventoGoogle(OPCOES)).eventoId).toBe(ID);
    expect(requests[1]?.method).toBe('POST');
    const corpo = JSON.parse(requests[1]?.body as string) as Record<string, unknown>;
    expect(corpo.id).toBe(ID);
    expect(corpo.location).toBe(OPCOES.salaUrl);
    expect(corpo).not.toHaveProperty('conferenceData');
  });

  it('interrompe um conflito de versão em vez de sobrescrever uma alteração mais recente', async () => {
    await Promise.resolve();
    let chamadas = 0;
    vi.stubGlobal('fetch', async () => {
      await Promise.resolve();
      return ++chamadas === 1 ? Response.json(existente) : new Response(null, { status: 412 });
    });
    await expect(aplicarEventoGoogle(OPCOES)).rejects.toThrow('412');
  });
});

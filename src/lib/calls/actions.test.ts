import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  from,
  getClaims,
  redirect,
  revalidatePath,
  removerCallDoGoogle,
  rpc,
  sincronizarCallNoGoogle,
} = vi.hoisted(() => ({
  from: vi.fn(),
  getClaims: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  removerCallDoGoogle: vi.fn(),
  rpc: vi.fn(),
  sincronizarCallNoGoogle: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getClaims }, from, rpc })),
}));
vi.mock('@/lib/google-calendar/eventos', () => ({ removerCallDoGoogle, sincronizarCallNoGoogle }));

import { agendarReuniao, resolverReuniaoPendente } from './actions';

const OPORTUNIDADE_ID = '11111111-1111-4111-8111-111111111111';
const REUNIAO_ID = '22222222-2222-4222-8222-222222222222';
const CODIGO_PUBLICO = '33333333-3333-4333-8333-333333333333';

function dadosValidos() {
  const dados = new FormData();
  dados.set('oportunidade', OPORTUNIDADE_ID);
  dados.set('tipo', 'descoberta');
  dados.set('titulo', 'Descoberta do atendimento');
  dados.set('agendadaPara', '2026-08-14T15:00');
  dados.set('duracao', '45');
  dados.set('offsetMinutos', '180');
  dados.set('liveCoach', 'on');
  dados.set('enviarConviteGoogle', 'on');
  dados.set('convidadoEmail', 'cliente@clinica.com.br');
  return dados;
}

function prepararBancoComCalendarAtivo() {
  from.mockImplementation((tabela: string) => {
    if (tabela === 'google_calendar_conexoes') {
      return {
        select: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { status: 'ativa' }, error: null })),
        })),
      };
    }
    if (tabela === 'calls_reunioes') {
      return {
        update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      };
    }
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: {
                titulo: 'Automação do atendimento',
                empresa: { nome: 'Clínica Aurora' },
                contato: { nome: 'Camila Rios' },
              },
              error: null,
            }),
          ),
        })),
      })),
    };
  });
}

describe('agendarReuniao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClaims.mockResolvedValue({ data: { claims: { sub: 'usuario-1' } } });
    prepararBancoComCalendarAtivo();
    sincronizarCallNoGoogle.mockResolvedValue({ status: 'sincronizado', eventoUrl: null });
  });

  it('abre a confirmação da sala criada e revalida o lead', async () => {
    rpc.mockResolvedValue({
      data: [{ reuniao_id: REUNIAO_ID, codigo_publico: CODIGO_PUBLICO }],
      error: null,
    });

    await agendarReuniao({}, dadosValidos());

    expect(rpc).toHaveBeenCalledWith('calls_agendar_reuniao', {
      p_oportunidade: OPORTUNIDADE_ID,
      p_tipo: 'descoberta',
      p_agendada_para: '2026-08-14T18:00:00.000Z',
      p_duracao_minutos: 45,
      p_titulo: 'Descoberta do atendimento',
      p_live_coach_ativo: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/crm/${OPORTUNIDADE_ID}`);
    expect(revalidatePath).toHaveBeenCalledWith('/inicio');
    expect(redirect).toHaveBeenCalledWith(`/reunioes?agendada=${REUNIAO_ID}&calendar=sincronizado`);
  });

  it('não navega quando a call volta sem identificador', async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    const resposta = await agendarReuniao({}, dadosValidos());

    expect(resposta.erro).toContain('não conseguimos abrir a sala preparada');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('exige a conexão do Calendar antes de qualquer call', async () => {
    from.mockImplementation((tabela: string) => {
      if (tabela !== 'google_calendar_conexoes') return {};
      return {
        select: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      };
    });

    const resposta = await agendarReuniao({}, dadosValidos());

    expect(resposta.erro).toContain('Conecte seu Google Calendar');
    expect(rpc).not.toHaveBeenCalledWith('calls_agendar_reuniao', expect.anything());
  });

  it('cria o evento no Google com a sala pública da call', async () => {
    const dados = dadosValidos();
    dados.set('enviarConviteGoogle', 'on');
    dados.set('convidadoEmail', 'cliente@clinica.com.br');
    rpc.mockResolvedValue({
      data: [{ reuniao_id: REUNIAO_ID, codigo_publico: CODIGO_PUBLICO }],
      error: null,
    });
    await agendarReuniao({}, dados);

    expect(sincronizarCallNoGoogle).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        reuniaoId: REUNIAO_ID,
        codigoPublico: CODIGO_PUBLICO,
        convidadoEmail: 'cliente@clinica.com.br',
      }),
    );
    expect(redirect).toHaveBeenCalledWith(`/reunioes?agendada=${REUNIAO_ID}&calendar=sincronizado`);
  });
});

describe('resolverReuniaoPendente', () => {
  const atualizar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getClaims.mockResolvedValue({ data: { claims: { sub: 'usuario-1' } } });
    atualizar.mockReturnValue({
      eq: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ error: null })) })),
    });
    from.mockImplementation((tabela: string) => {
      if (tabela !== 'calls_reunioes') return {};
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({
                data: {
                  id: REUNIAO_ID,
                  oportunidade_id: OPORTUNIDADE_ID,
                  tipo: 'descoberta',
                  status: 'agendada',
                  agendada_para: '2026-08-20T15:00:00.000Z',
                  duracao_minutos: 45,
                  google_event_id: 'evento-google',
                  google_calendar_id: 'primary',
                },
                error: null,
              }),
            ),
          })),
        })),
        update: atualizar,
      };
    });
  });

  it('não encerra a reunião quando o convite do Google não pôde ser cancelado', async () => {
    removerCallDoGoogle.mockResolvedValue({ status: 'falhou' });
    redirect.mockImplementationOnce(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const dados = new FormData();
    dados.set('reuniao', REUNIAO_ID);
    dados.set('destino', 'cancelar');

    await expect(resolverReuniaoPendente(dados)).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/reunioes?pendencia=erro');
    expect(atualizar).not.toHaveBeenCalled();
  });

  it('só encerra a reunião depois de cancelar o convite antigo', async () => {
    removerCallDoGoogle.mockResolvedValue({ status: 'removido' });
    const dados = new FormData();
    dados.set('reuniao', REUNIAO_ID);
    dados.set('destino', 'cancelar');

    await resolverReuniaoPendente(dados);

    const dadosAtualizacao = atualizar.mock.calls[0]?.[0] as {
      status: string;
      encerrada_em: string;
    };
    expect(dadosAtualizacao.status).toBe('cancelada');
    expect(Date.parse(dadosAtualizacao.encerrada_em)).not.toBeNaN();
    expect(removerCallDoGoogle.mock.invocationCallOrder[0]).toBeLessThan(
      atualizar.mock.invocationCallOrder[0]!,
    );
    expect(redirect).toHaveBeenCalledWith('/reunioes?pendencia=cancelada');
  });
});

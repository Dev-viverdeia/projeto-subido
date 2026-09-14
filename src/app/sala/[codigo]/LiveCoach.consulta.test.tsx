import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { montarPlanoCall } from '@/lib/calls/plano';
const { sala } = vi.hoisted(() => ({ sala: { state: 'connected', on: vi.fn(), off: vi.fn() } }));
vi.mock('@livekit/components-react', () => ({ useRoomContext: () => sala, useTracks: () => [] }));
import { LiveCoach } from './LiveCoach';

const plano = montarPlanoCall({
  tipo: 'descoberta',
  empresa: 'Horizonte',
  oportunidade: 'Atendimento',
  proximaAcao: null,
  dossie: null,
});
describe('consulta não reinicia os processos da sala', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('permite salvar uma saída local sem encerrar e mantém o encerramento explícito', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ status: 'gravando' }), { status: 200 })),
      );
    const ref = createRef<((encerrar?: boolean) => Promise<void>) | null>();
    const { unmount } = render(
      <LiveCoach reuniaoId="reuniao-1" ativo={false} plano={plano} encerramentoRef={ref} />,
    );
    await screen.findByText('Gravação protegida');
    await ref.current!(false);
    await ref.current!(true);
    expect(
      fetch.mock.calls
        .filter(([url]) => typeof url === 'string' && url.endsWith('/finalizar'))
        .map(([, options]) => JSON.parse(options!.body as string) as unknown),
    ).toEqual([
      { encerrar: false, segmentos: [] },
      { encerrar: true, segmentos: [] },
    ]);
    unmount();
    expect(ref.current).toBeNull();
    fetch.mockRestore();
  });
  it.each([true, false])(
    'preserva captura ao trocar o roteiro com Live Coach %s',
    async (ativo) => {
      const fetch = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ status: 'gravando' }), { status: 200 }));
      const user = userEvent.setup();
      const { unmount } = render(<LiveCoach reuniaoId="reuniao-1" ativo={ativo} plano={plano} />);
      expect(await screen.findByText('Gravação protegida')).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: 'Ao vivo' }));
        await user.click(screen.getByRole('button', { name: 'Roteiro' }));
      }
      expect(screen.getByRole('heading', { name: plano.perguntas[1]!.pergunta })).toBeVisible();
      // Somente o início já existente da gravação. Nenhuma repetição, transcrição ou IA por consultar.
      expect(fetch.mock.calls).toEqual([['/api/calls/reuniao-1/gravacao', { method: 'POST' }]]);
      unmount();
      fetch.mockRestore();
    },
  );
});

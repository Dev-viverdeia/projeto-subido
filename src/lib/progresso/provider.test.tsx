import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  concluirAulaConta,
  definirEtapaConta,
  importarProgressoConta,
  tocarFormacaoConta,
} from './actions';
import { PROGRESSO_VAZIO } from './estado';
import {
  guardarProgressoLegado,
  limparProgressoLegado,
  useAcoesProgresso,
  useProgresso,
} from './local';
import { ProgressoProvider } from './provider';

vi.mock('./actions', () => ({
  concluirAulaConta: vi.fn(),
  definirEtapaConta: vi.fn(),
  importarProgressoConta: vi.fn(),
  tocarFormacaoConta: vi.fn(),
}));

const sucesso = { ok: true } as const;

function Bancada() {
  const progresso = useProgresso();
  const { concluirAula, alternarEtapa } = useAcoesProgresso();
  return (
    <div>
      <output aria-label="aulas">{Object.keys(progresso.aulas).join(',')}</output>
      <output aria-label="etapas">{Object.keys(progresso.etapas).join(',')}</output>
      <button type="button" onClick={() => concluirAula('aula-1', 'formacao-base')}>
        Concluir aula
      </button>
      <button type="button" onClick={() => alternarEtapa('etapa-1', 'projeto-base')}>
        Alternar etapa
      </button>
    </div>
  );
}

function montar() {
  return render(
    <ProgressoProvider inicial={PROGRESSO_VAZIO}>
      <Bancada />
    </ProgressoProvider>,
  );
}

beforeEach(() => {
  vi.mocked(concluirAulaConta).mockReset().mockResolvedValue(sucesso);
  vi.mocked(definirEtapaConta).mockReset().mockResolvedValue(sucesso);
  vi.mocked(importarProgressoConta).mockReset().mockResolvedValue(sucesso);
  vi.mocked(tocarFormacaoConta).mockReset().mockResolvedValue(sucesso);
  limparProgressoLegado();
});

describe('sincronização do progresso', () => {
  it('responde na hora e confirma a marcação na conta', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Concluir aula' }));

    expect(screen.getByLabelText('aulas')).toHaveTextContent('aula-1');
    expect(concluirAulaConta).toHaveBeenCalledWith('aula-1', 'formacao-base');
  });

  it('migra o histórico do navegador e só então limpa o legado', async () => {
    guardarProgressoLegado({
      aulas: { antiga: '2026-08-08T10:00:00.000Z' },
      formacoes: {},
      etapas: {},
      solucoes: {},
    });

    montar();

    await waitFor(() => expect(importarProgressoConta).toHaveBeenCalledOnce());
    expect(screen.getByLabelText('aulas')).toHaveTextContent('antiga');
    await waitFor(() => expect(localStorage.getItem('subido_progresso_v1')).toBeNull());
  });

  it('protege a marcação no dispositivo quando o backend falha', async () => {
    vi.mocked(definirEtapaConta).mockResolvedValue({ ok: false, mensagem: 'falhou' });
    const user = userEvent.setup();
    montar();

    await user.click(screen.getByRole('button', { name: 'Alternar etapa' }));

    expect(screen.getByLabelText('etapas')).toHaveTextContent('etapa-1');
    expect(
      await screen.findByRole('alert', { name: 'Sincronização do progresso' }),
    ).toHaveTextContent('Seu avanço está protegido');
    expect(localStorage.getItem('subido_progresso_v1')).toContain('etapa-1');
  });
});

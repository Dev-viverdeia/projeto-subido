import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EstadoStack } from '@/lib/builder/queries';
import { projetoEstudioPreview } from '@/app/preview/estudio-sala/fixture';
import { EtapaKit } from './EtapaKit';

vi.mock('@/lib/builder/actions', () => ({ escolherStack: vi.fn() }));
const documento = projetoEstudioPreview.documento!;

describe('Preparação do Estúdio', () => {
  it('aguarda confirmação antes de mudar a ferramenta selecionada', async () => {
    let resolver!: (resultado: { ok: boolean }) => void;
    const salvar = vi.fn<(dados: FormData) => Promise<{ ok: boolean }>>(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        }),
    );
    render(<EtapaKit id="projeto" documento={documento} stack={null} salvar={salvar} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Lovable + Supabase' }));
    expect(screen.getByRole('status')).toHaveTextContent('Salvando escolha');
    expect(screen.getByRole('radio', { name: 'Lovable + Supabase' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Claude Code + Supabase' })).toBeDisabled();
    resolver({ ok: false });
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar');
    expect(salvar.mock.calls[0]?.[0].get('stack')).toBe('lovable_supabase');
  });

  it('falha mantém a escolha anterior e permite tentar novamente', async () => {
    const salvar = vi
      .fn()
      .mockRejectedValueOnce(new Error('interno'))
      .mockResolvedValue({ ok: true });
    render(<EtapaKit id="projeto" documento={documento} stack="lovable_cloud" salvar={salvar} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Lovable + Supabase' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Lovable + Lovable Cloud' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Lovable + Supabase' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(salvar).toHaveBeenCalledTimes(2);
  });

  it('escolha confirmada mostra instruções e mantém os prompts sob demanda', async () => {
    function Cenario() {
      const [stack, setStack] = useState<EstadoStack>(null);
      return (
        <EtapaKit
          id="projeto"
          documento={documento}
          stack={stack}
          salvar={(dados) => {
            setStack(dados.get('stack') as EstadoStack);
            return Promise.resolve({ ok: true });
          }}
        />
      );
    }
    render(<Cenario />);
    await userEvent.click(screen.getByRole('radio', { name: 'Lovable + Supabase' }));
    expect(
      await screen.findByRole('heading', { name: 'Comece no Lovable + Supabase' }),
    ).toBeVisible();
    expect(screen.getByText('Prompt de partida').closest('details')).not.toHaveAttribute('open');
    await userEvent.click(screen.getByText('Prompt de partida'));
    expect(screen.getByText('Prompt de partida').closest('details')).toHaveAttribute('open');
    expect(screen.getByText(documento.prompts[0]!.titulo).closest('details')).not.toHaveAttribute(
      'open',
    );
    expect(screen.getByRole('link', { name: 'Baixar projeto (.zip)' })).toHaveAttribute(
      'href',
      '/api/builder/projeto/kit',
    );
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultadoBusca } from './ResultadoBusca';

const substituir = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: substituir }),
}));

beforeEach(() => {
  substituir.mockReset();
  window.history.replaceState({}, '', '/prospeccao?lista=lista-1&busca=falhou');
});

afterEach(cleanup);

describe('resultado da busca de prospecção', () => {
  it('mantém a falha em primeiro plano e confirma o estorno', async () => {
    const usuario = userEvent.setup();
    render(
      <ResultadoBusca
        estado="falhou"
        segmento="Clínicas odontológicas"
        localizacao="Florianópolis"
        solicitadas={5}
        encontradas={0}
      />,
    );

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
      'Não conseguimos montar esta lista.',
    );
    expect(screen.getByText('5 devolvidos ao saldo')).toBeVisible();

    await usuario.click(screen.getByRole('button', { name: 'Ajustar e tentar de novo' }));

    expect(substituir).toHaveBeenCalledWith('/prospeccao?lista=lista-1');
  });

  it('mostra quantas empresas ficaram prontas antes de abrir a lista', () => {
    render(
      <ResultadoBusca
        estado="concluida"
        segmento="Clínicas odontológicas"
        localizacao="Florianópolis"
        solicitadas={5}
        encontradas={5}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Sua lista está pronta.');
    expect(screen.getByText('5 de 5 solicitadas')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ver empresas' })).toBeVisible();
  });
});

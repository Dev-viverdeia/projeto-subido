import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { projetoPreview, rotaPreview } from '@/app/preview/projetos/fixture';
import type { ProjetoGuiado } from './ProjetoGuiado';

let Tela: typeof ProjetoGuiado;
beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  Reflect.defineProperty(Element.prototype, 'scrollIntoView', { value: vi.fn(), writable: true });
  Tela = (await import('./ProjetoGuiado')).ProjetoGuiado;
});

function montar() {
  return render(
    <Tela
      slug="sdr-atendimento"
      titulo="SDR de Atendimento com IA"
      resumo={projetoPreview.resultado}
      categoria="Vendas"
      projeto={projetoPreview}
      ferramentas={[]}
      prompts={[]}
      videoUrl={null}
      proxima={null}
      rotaComercial={rotaPreview}
    />,
  );
}

describe('Navegação e retomada do projeto', () => {
  it('permite navegar pelas áreas com setas, Home e End sem perder o foco', async () => {
    const user = userEvent.setup();
    montar();
    screen.getByRole('tab', { name: 'Aprender' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Implementar' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Implementar');
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Materiais' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Aprender' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Materiais' })).toHaveFocus();
  });

  it('acompanha o progresso recebido após abrir, sem sobrescrever a aula escolhida', async () => {
    const user = userEvent.setup();
    montar();
    const { guardarProgressoLegado } = await import('@/lib/progresso/local');
    const { idAulaProjeto } = await import('@/lib/projetos/roteiro');
    act(() =>
      guardarProgressoLegado({
        aulas: {},
        formacoes: {},
        solucoes: {},
        etapas: {
          [idAulaProjeto('sdr-atendimento', 0)]: '2026-09-05T12:00:00.000Z',
        },
      }),
    );
    expect(screen.getByRole('button', { name: /Aula 2:/ })).toHaveAttribute('aria-current', 'step');
    await user.click(screen.getByRole('button', { name: /Aula 1:/ }));
    expect(screen.getByRole('button', { name: /Aula 1:/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /Reabrir aula/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

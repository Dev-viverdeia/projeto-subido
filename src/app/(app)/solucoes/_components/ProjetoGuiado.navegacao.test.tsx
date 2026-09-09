import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
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
  it('abre a aplicação no cliente com um clique, transfere o foco e preserva a consulta', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Usar com cliente' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Usar com cliente' })).toHaveFocus(),
    );
    expect(screen.getByRole('button', { name: 'Aplicar no cliente' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('link', { name: 'Adicionar empresa' })).toHaveAttribute(
      'href',
      '/vendas?novo=projeto&projeto=SDR%20de%20Atendimento%20com%20IA&projetoSlug=sdr-atendimento',
    );
    await user.click(screen.getByRole('button', { name: 'Arquivos e ferramentas' }));
    await user.click(screen.getByRole('tab', { name: 'Visão geral' }));
    await user.click(screen.getByRole('tab', { name: 'Pré-requisitos e materiais' }));
    expect(screen.getByRole('button', { name: 'Arquivos e ferramentas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('permite navegar pelas áreas com setas, Home e End sem perder o foco', async () => {
    const user = userEvent.setup();
    montar();
    screen.getByRole('tab', { name: 'Visão geral' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Aprender' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Implementar' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Implementar');
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Pré-requisitos e materiais' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Visão geral' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Pré-requisitos e materiais' })).toHaveFocus();
  });

  it('acompanha o progresso recebido após abrir, sem sobrescrever a aula escolhida', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('tab', { name: 'Aprender' }));
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

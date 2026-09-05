import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FORMACAO_DEMO } from '@/app/preview/formacoes/fixture';
import { AulaConteudo } from './AulaConteudo';

vi.mock('./NavAula', () => ({ NavAula: () => null }));
vi.mock('./PlaylistAula', () => ({ PlaylistAula: () => null }));

const aulas = FORMACAO_DEMO.modulos.flatMap((modulo) => modulo.aulas);
const props = {
  formacao: FORMACAO_DEMO,
  aula: aulas[0]!,
  videoUrl: 'https://video.exemplo.test/primeira',
  anterior: null,
  proxima: aulas[1]!,
  posicao: 1,
  total: aulas.length,
};

describe('Player da aula', () => {
  it('não carrega o player antes de uma ação e não finge vídeo quando não existe', async () => {
    const { container, rerender } = render(<AulaConteudo {...props} />);
    expect(container.querySelector('iframe')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Assistir:/ }));
    expect(container.querySelector('iframe')).toHaveAttribute('src', props.videoUrl);
    rerender(<AulaConteudo {...props} videoUrl={null} />);
    expect(screen.getByText('Vídeo em produção')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Assistir:/ })).toBeNull();
  });

  it('preserva o player na mesma aula e volta à capa ao navegar para outra', async () => {
    const { container, rerender } = render(<AulaConteudo {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /Assistir:/ }));
    const player = container.querySelector('iframe');
    rerender(<AulaConteudo {...props} />);
    expect(container.querySelector('iframe')).toBe(player);
    rerender(
      <AulaConteudo
        {...props}
        aula={aulas[1]!}
        posicao={2}
        videoUrl="https://video.exemplo.test/segunda"
      />,
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('button', { name: `Assistir: ${aulas[1]!.titulo}` })).toBeVisible();
  });
});

import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
import { TrechoEncontrado } from './TrechoEncontrado';
it('destaca todas as ocorrências literais sem executar HTML ou regex', () => {
  const { container } = render(
    <TrechoEncontrado texto={'<script>20%_[x]</script> e 20%_[x]'} busca="20%_[x]" />,
  );
  expect(container.querySelectorAll('mark')).toHaveLength(2);
  expect(container.querySelector('script')).toBeNull();
  expect(container.textContent).toBe('<script>20%_[x]</script> e 20%_[x]');
});
it('preserva acentos, caixa e o texto sem termo', () => {
  const { container, rerender } = render(
    <TrechoEncontrado texto="Reunião e REUNIÃO" busca="reunião" />,
  );
  expect(container.querySelectorAll('mark')).toHaveLength(2);
  expect(container.textContent).toBe('Reunião e REUNIÃO');
  rerender(<TrechoEncontrado texto="Sem busca" busca=" " />);
  expect(container.querySelector('mark')).toBeNull();
  expect(container.textContent).toBe('Sem busca');
});

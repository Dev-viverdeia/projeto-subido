import type { MouseEvent, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const guardar = vi.hoisted(() => vi.fn());
vi.mock('@/lib/prospeccao/retorno-local', () => ({ guardarRetornoProspeccao: guardar }));
vi.mock('@/lib/prospeccao/actions', () => ({ enviarLeadAoCrm: vi.fn() }));
vi.mock('next/link', () => ({
  default: ({
    children,
    onNavigate,
    ...props
  }: {
    children: ReactNode;
    onNavigate?: () => void;
  }) => (
    <a
      {...props}
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) onNavigate?.();
      }}
    >
      {children}
    </a>
  ),
}));
import { BotaoEnviarCrm } from './BotaoEnviarCrm';

const lista = '11111111-1111-4111-8111-111111111111';
const lead = '22222222-2222-4222-8222-222222222222';
const oportunidade = '33333333-3333-4333-8333-333333333333';
beforeEach(() => vi.clearAllMocks());

it('captura a saída apenas na navegação da aba atual, não em Cmd/Ctrl+clique', () => {
  render(<BotaoEnviarCrm lead={lead} lista={lista} oportunidade={oportunidade} />);
  const link = screen.getByRole('link', { name: 'Abrir ficha' });
  fireEvent.click(link, { ctrlKey: true });
  expect(guardar).not.toHaveBeenCalled();
  fireEvent.click(link);
  expect(guardar).toHaveBeenCalledExactlyOnceWith({ lista, empresa: lead });
});

it('guarda a posição antes de submeter a criação sem mudar seus campos', () => {
  render(<BotaoEnviarCrm lead={lead} lista={lista} />);
  const form = screen.getByRole('button', { name: 'Criar oportunidade' }).closest('form')!;
  fireEvent.submit(form);
  expect(guardar).toHaveBeenCalledExactlyOnceWith({ lista, empresa: lead });
  expect(new FormData(form).get('lista')).toBe(lista);
  expect(new FormData(form).get('lead')).toBe(lead);
});

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { chaveRascunhoAgenda } from '@/lib/calls/rascunho-agenda';
const { agendar } = vi.hoisted(() => ({ agendar: vi.fn() }));
vi.mock('@/lib/calls/actions', () => ({ agendarReuniao: agendar }));
import { FormularioAgendarComRascunho } from './FormularioAgendarComRascunho';
const props = {
  oportunidades: [],
  comercialLiberado: false,
  abertoInicial: true,
  rascunhoDono: 'dono-a',
  calendar: {
    configurado: true,
    conectado: true,
    email: 'dono@example.com',
    status: 'ativa' as const,
    ultimoErro: null,
  },
};
beforeEach(() => {
  sessionStorage.clear();
  agendar.mockReset();
});
it('restaura horário, destinatário e coach após voltar do Google e limpa ao fechar', async () => {
  sessionStorage.setItem(
    chaveRascunhoAgenda('dono-a'),
    JSON.stringify({
      salvoEm: Date.now(),
      campos: {
        empresa: 'Empresa QA',
        contato: 'Marina',
        agendadaPara: '2099-10-10T15:00',
        duracao: '60',
        convidadoEmail: 'marina@example.com',
        liveCoach: '',
        tipo: 'descoberta',
      },
    }),
  );
  render(<FormularioAgendarComRascunho {...props} />);
  await waitFor(() => expect(screen.getByLabelText('Empresa')).toHaveValue('Empresa QA'));
  expect(screen.getByLabelText('Data e horário')).toHaveValue('2099-10-10T15:00');
  expect(screen.getByLabelText('E-mail do cliente')).toHaveValue('marina@example.com');
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(sessionStorage.getItem(chaveRascunhoAgenda('dono-a'))).toBeNull();
});
it('não restaura dados de outra conta', () => {
  sessionStorage.setItem(
    chaveRascunhoAgenda('dono-b'),
    JSON.stringify({ salvoEm: Date.now(), campos: { empresa: 'Privada' } }),
  );
  render(<FormularioAgendarComRascunho {...props} />);
  expect(screen.getByLabelText('Empresa')).toHaveValue('');
});
it('guarda o preenchimento apenas ao escolher reconectar, mantendo coach desligado', async () => {
  agendar.mockImplementation((_estado: unknown, form: FormData) =>
    Promise.resolve({
      erro: 'Reconecte sua agenda.',
      reconectar: true,
      campos: Object.fromEntries(
        [...form.entries()]
          .filter(([, valor]) => typeof valor === 'string')
          .concat([['liveCoach', form.has('liveCoach') ? 'on' : '']]),
      ),
    }),
  );
  render(<FormularioAgendarComRascunho {...props} />);
  await userEvent.type(screen.getByLabelText('Empresa'), 'Nina');
  await userEvent.type(screen.getByLabelText('Pessoa convidada'), 'Marina');
  await userEvent.type(screen.getByLabelText('E-mail do cliente'), 'marina@example.com');
  fireEvent.change(screen.getByLabelText('Data e horário'), {
    target: { value: '2099-10-10T15:00' },
  });
  await userEvent.click(screen.getByRole('checkbox'));
  await userEvent.click(screen.getByRole('button', { name: 'Criar reunião e enviar convite' }));
  const link = await screen.findByRole('link', { name: 'Reconectar agenda' });
  expect(sessionStorage.getItem(chaveRascunhoAgenda('dono-a'))).toBeNull();
  link.addEventListener('click', (event) => event.preventDefault());
  await userEvent.click(link);
  const salvo = JSON.parse(sessionStorage.getItem(chaveRascunhoAgenda('dono-a'))!) as {
    campos: { empresa: string; liveCoach: string };
  };
  expect(salvo.campos.empresa).toBe('Nina');
  expect(salvo.campos.liveCoach).toBe('');
});

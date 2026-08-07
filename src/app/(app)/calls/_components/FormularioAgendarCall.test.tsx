import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OportunidadeCrm } from '@/lib/crm/queries';

vi.mock('@/lib/calls/actions', () => ({
  agendarReuniao: vi.fn(() => Promise.resolve({})),
}));

import { FormularioAgendarCall } from './FormularioAgendarCall';

const OPORTUNIDADE: OportunidadeCrm = {
  id: '22222222-2222-4222-8222-222222222222',
  titulo: 'Automação do atendimento',
  etapa: 'descoberta',
  empresaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  empresa: 'Clínica Aurora',
  contatoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  contato: 'Camila Rios',
  contatoEmail: 'camila@exemplo.com',
  valorCentavos: null,
  proximaAcao: null,
  proximaAcaoEm: null,
  ultimoFato: null,
  ultimoFatoEm: null,
  atualizadoEm: new Date().toISOString(),
  criadoEm: new Date().toISOString(),
};

describe('FormularioAgendarCall', () => {
  it('abre com oportunidade real, Live Coach ativo e devolve o foco ao fechar', async () => {
    render(<FormularioAgendarCall oportunidades={[OPORTUNIDADE]} />);

    const gatilho = screen.getByRole('button', { name: 'Agendar call' });
    fireEvent.click(gatilho);

    expect(screen.getByRole('dialog', { name: 'Agendar call' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Oportunidade')).toHaveFocus());
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('option', { name: /Clínica Aurora/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(gatilho).toHaveFocus());
  });
});

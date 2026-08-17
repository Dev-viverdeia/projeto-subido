import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListaResultados } from './ListaResultados';

vi.mock('@/lib/prospeccao/actions', () => ({
  enviarLeadAoCrm: vi.fn(),
}));

const LEAD = {
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'Clínica Aurora',
  categoria: 'Clínica odontológica',
  endereco: 'Rua das Flores, 120 · Belo Horizonte, MG',
  cidade: 'Belo Horizonte',
  estado: 'MG',
  site_url: 'https://clinica-aurora.example.com',
  telefone: '+55 31 3333-4444',
  avaliacao: 4.8,
  total_avaliacoes: 127,
  descricao: 'Atendimento odontológico com agendamento pelo WhatsApp.',
  fontes: ['Google Maps · dados públicos'],
  crm_oportunidade_id: null,
  enviado_crm_em: null,
};

describe('resultados da prospecção', () => {
  it('abre os detalhes clicando em qualquer parte da linha e oferece envio ao CRM', async () => {
    const user = userEvent.setup();
    render(<ListaResultados leads={[LEAD]} />);

    const linha = screen.getByRole('button', { name: /Clínica Aurora/ });
    await user.click(linha);

    expect(screen.getByRole('dialog', { name: 'Clínica Aurora' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar para o CRM' })).toBeInTheDocument();
    expect(screen.getByText('Google Maps · dados públicos')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Fechar detalhes' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(linha).toHaveFocus();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListaResultados } from './ListaResultados';

vi.mock('@/lib/prospeccao/actions', () => ({
  enviarLeadAoCrm: vi.fn(),
  registrarContatoProspeccao: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const LEAD = {
  id: '11111111-1111-4111-8111-111111111111',
  nome: 'Clínica Aurora',
  categoria: 'Clínica odontológica',
  endereco: 'Rua das Flores, 120 · Belo Horizonte, MG',
  cidade: 'Belo Horizonte',
  estado: 'MG',
  site_url: 'https://clinica-aurora.example.com',
  dominio: 'clinica-aurora.example.com',
  telefone: '+55 31 3333-4444',
  telefones: ['+55 31 3333-4444'],
  emails: ['contato@clinica-aurora.example.com'],
  redes_sociais: [{ rede: 'instagram', url: 'https://instagram.com/clinicaaurora' }],
  decisores: [
    {
      nome: 'Ana Aurora',
      cargo: 'Fundadora',
      senioridade: 'Founder',
      linkedin_url: 'https://linkedin.com/in/ana-aurora',
      localizacao: 'Belo Horizonte, MG',
      email: null,
      telefone: null,
      fonte: 'FullEnrich · perfil profissional público',
    },
  ],
  horarios: [{ dia: 'segunda-feira', horarios: '08:00–18:00' }],
  maps_url: 'https://maps.google.com/?q=clinica-aurora',
  imagem_url: null,
  avaliacao: 4.8,
  total_avaliacoes: 127,
  descricao: 'Atendimento odontológico com agendamento pelo WhatsApp.',
  fontes: ['Google Maps · dados públicos'],
  qualificacao: {
    completude: 100,
    itens: { telefone: true, email: true, site: true, redes_sociais: true, decisores: true },
    sinais: ['Telefone e e-mail disponíveis para abordagem'],
  },
  dados: {},
  status_prospeccao: 'novo',
  ultimo_canal: null,
  ultimo_contato_em: null,
  tentativas_contato: 0,
  crm_oportunidade_id: null,
  enviado_crm_em: null,
};

describe('resultados da prospecção', () => {
  it('abre a estação de prospecção clicando em qualquer parte da linha', async () => {
    const user = userEvent.setup();
    render(<ListaResultados leads={[LEAD]} />);

    const linha = screen.getByRole('button', { name: /Clínica Aurora/ });
    await user.click(linha);

    expect(screen.getByRole('dialog', { name: 'Clínica Aurora' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abrir WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Escrever e-mail/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alguém respondeu' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Criar oportunidade no CRM' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Google Maps · dados públicos')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Fechar detalhes da empresa' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(linha).toHaveFocus();
  });
});

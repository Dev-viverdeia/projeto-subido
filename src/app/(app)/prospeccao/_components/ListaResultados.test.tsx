import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListaResultados } from './ListaResultados';

vi.mock('@/lib/prospeccao/actions', () => ({
  enviarLeadAoCrm: vi.fn(),
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
  telefones: ['+55 31 3333-4444', '+553133334444'],
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
      fonte: 'Pesquisa pública · fonte identificada',
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
    oportunidade: {
      projeto_slug: 'sdr-atendimento-qualificacao',
      projeto_titulo: 'SDR de Atendimento e Qualificação',
      motivo: 'A clínica recebe contatos pelo WhatsApp e pode organizar a triagem inicial.',
      pergunta_abertura:
        'Como vocês recebem e distribuem hoje os novos contatos que chegam pelo WhatsApp?',
      melhor_canal: 'whatsapp',
      confianca: 'media',
      evidencias: ['Atendimento odontológico com agendamento pelo WhatsApp'],
    },
  },
  dados: {},
  crm_oportunidade_id: null,
};

describe('resultados da prospecção', () => {
  it('mostra os contatos no card e abre os detalhes sem etapas de acompanhamento', async () => {
    const user = userEvent.setup();
    render(<ListaResultados leads={[LEAD]} />);

    expect(screen.getByRole('link', { name: '+55 31 3333-4444' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'contato@clinica-aurora.example.com' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar oportunidade' })).toBeInTheDocument();
    expect(screen.getByText('SDR de Atendimento e Qualificação')).toBeInTheDocument();

    const detalhes = screen.getByRole('button', { name: 'Ver detalhes' });
    await user.click(detalhes);

    expect(screen.getByRole('dialog', { name: 'Clínica Aurora' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /WhatsApp/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Escrever/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '+553133334444' })).not.toBeInTheDocument();
    expect(screen.queryByText('Alguém respondeu')).not.toBeInTheDocument();
    expect(screen.getByText('Google Maps · dados públicos')).toBeInTheDocument();
    expect(
      screen.getByText(/Como vocês recebem e distribuem hoje os novos contatos/),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Fechar detalhes da empresa' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(detalhes).toHaveFocus();
  });
});

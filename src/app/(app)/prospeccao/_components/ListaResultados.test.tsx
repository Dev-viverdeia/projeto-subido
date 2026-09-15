import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListaResultados } from './ListaResultados';
import { registrarTentativaContato } from '@/lib/prospeccao/actions';

vi.mock('@/lib/prospeccao/actions', () => ({
  enviarLeadAoCrm: vi.fn(),
  registrarTentativaContato: vi.fn().mockResolvedValue(undefined),
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

    expect(
      screen.getByRole('link', { name: 'Telefone / WhatsApp: (31) 3333-4444' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'E-mail da empresa: contato@clinica-aurora.example.com' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar oportunidade' })).toBeInTheDocument();
    expect(screen.getByText('SDR de Atendimento e Qualificação')).toBeInTheDocument();

    const detalhes = screen.getByRole('button', { name: 'Ver detalhes' });
    await user.click(detalhes);

    const dialogo = screen.getByRole('dialog', { name: 'Clínica Aurora' });
    expect(dialogo).toBeInTheDocument();
    expect(within(dialogo).getByRole('link', { name: /WhatsApp/ })).toBeInTheDocument();
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

  it('deixa a hipótese visível sem um bloco vazio de decisor ou notas decorativas', () => {
    render(<ListaResultados leads={[{ ...LEAD, decisores: [] }]} />);
    expect(screen.getByText('Projeto para validar')).toBeInTheDocument();
    expect(screen.queryByText('Responsável a identificar')).not.toBeInTheDocument();
    expect(screen.queryByText('Possível contato')).not.toBeInTheDocument();
    expect(screen.queryByText('Muitos dados encontrados')).not.toBeInTheDocument();
    expect(screen.queryByText('01')).not.toBeInTheDocument();
    expect(screen.queryByText(LEAD.endereco)).not.toBeInTheDocument();
  });

  it('prioriza o canal sugerido somente quando ele está disponível', () => {
    render(
      <ListaResultados
        leads={[
          {
            ...LEAD,
            qualificacao: {
              ...LEAD.qualificacao,
              oportunidade: { ...LEAD.qualificacao.oportunidade, melhor_canal: 'email' },
            },
          },
        ]}
      />,
    );
    const links = within(screen.getByRole('listitem', { name: LEAD.nome })).getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', `mailto:${LEAD.emails[0]}`);
    expect(links[1]).toHaveAttribute('href', 'https://wa.me/553133334444');
  });

  it('mantém os canais encontrados se a sugestão não tiver contato disponível', () => {
    render(
      <ListaResultados
        leads={[
          {
            ...LEAD,
            emails: [],
            decisores: [],
            redes_sociais: [],
            qualificacao: {
              ...LEAD.qualificacao,
              oportunidade: { ...LEAD.qualificacao.oportunidade, melhor_canal: 'email' },
            },
          },
        ]}
      />,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://wa.me/553133334444');
  });

  it('oferece a rede social encontrada mesmo sem telefone, e-mail ou Instagram', () => {
    render(
      <ListaResultados
        leads={[
          {
            ...LEAD,
            telefone: null,
            telefones: [],
            emails: [],
            decisores: [],
            redes_sociais: [{ rede: 'facebook', url: 'https://facebook.com/clinicaaurora' }],
          },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Facebook: @clinicaaurora' })).toHaveAttribute(
      'href',
      'https://facebook.com/clinicaaurora',
    );
    expect(screen.queryByText('Contato ainda não encontrado')).not.toBeInTheDocument();
  });

  it('não associa o LinkedIn da empresa ao nome de um possível decisor', () => {
    render(
      <ListaResultados
        leads={[
          {
            ...LEAD,
            telefone: null,
            telefones: [],
            emails: [],
            decisores: [{ ...LEAD.decisores[0], linkedin_url: null }],
            redes_sociais: [
              { rede: 'linkedin', url: 'https://linkedin.com/company/clinicaaurora' },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'LinkedIn: Perfil da empresa' })).toHaveAttribute(
      'href',
      'https://linkedin.com/company/clinicaaurora',
    );
    expect(screen.queryByRole('link', { name: /Ana Aurora/ })).not.toBeInTheDocument();
  });

  it('explica a ausência de contato sem prometer dados inexistentes nos detalhes', () => {
    render(
      <ListaResultados
        leads={[
          {
            ...LEAD,
            telefone: null,
            telefones: [],
            emails: [],
            decisores: [],
            redes_sociais: [],
          },
        ]}
      />,
    );
    expect(screen.getByText('Contato ainda não encontrado')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver detalhes' })).toBeInTheDocument();
  });

  it('abre a ficha existente e preserva a lista nos formulários de novas oportunidades', () => {
    const { container } = render(
      <ListaResultados
        leads={[
          { ...LEAD, crm_oportunidade_id: 'cliente-existente' },
          { ...LEAD, id: 'outra-empresa', nome: 'Outra empresa' },
        ]}
        lista="lista-origem"
      />,
    );
    expect(screen.getByRole('link', { name: 'Abrir ficha' })).toHaveAttribute(
      'href',
      '/vendas/cliente-existente',
    );
    expect(screen.getAllByRole('button', { name: 'Criar oportunidade' })).toHaveLength(1);
    expect(container.querySelector('input[name="lista"]')).toHaveValue('lista-origem');
  });

  it('copia sem registrar abordagem e mantém o registro no link do canal', async () => {
    const user = userEvent.setup();
    const copiar = vi.spyOn(navigator.clipboard, 'writeText');
    vi.mocked(registrarTentativaContato).mockClear();
    render(<ListaResultados leads={[LEAD]} />);
    await user.click(screen.getByRole('button', { name: 'Copiar (31) 3333-4444' }));
    expect(copiar).toHaveBeenCalledWith('(31) 3333-4444');
    expect(screen.getByRole('button', { name: 'Contato copiado' })).toBeInTheDocument();
    expect(registrarTentativaContato).not.toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: `E-mail da empresa: ${LEAD.emails[0]}` }));
    expect(registrarTentativaContato).toHaveBeenCalledWith({ lead: LEAD.id, canal: 'email' });
  });
});

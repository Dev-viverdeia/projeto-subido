import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ProjetoInicialJornada } from '@/lib/jornada/queries';

vi.mock('@/lib/jornada/actions', () => ({
  salvarPerfilJornada: vi.fn(() => Promise.resolve({})),
}));

import { ConfiguracaoJornada } from './ConfiguracaoJornada';

const PROJETOS: ProjetoInicialJornada[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'atendimento-com-ia',
    titulo: 'Atendimento com IA',
    resumo: 'Estruture triagem, respostas e passagem para a equipe com contexto.',
    categoria: 'Atendimento',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'maquina-de-leads',
    titulo: 'Máquina de leads',
    resumo: 'Organize captura, qualificação e priorização comercial.',
    categoria: 'Leads',
  },
];

describe('ConfiguracaoJornada', () => {
  it('pede uma decisão por vez e preserva o que já foi preenchido', async () => {
    const user = userEvent.setup();
    render(<ConfiguracaoJornada perfil={null} projetos={PROJETOS} />);

    const nicho = screen.getByRole('textbox', { name: 'Nicho inicial' });
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    await user.type(nicho, 'Clínicas odontológicas');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    const projeto = screen.getByRole('radio', { name: /Atendimento com IA/ });
    expect(projeto).toBeInTheDocument();
    await user.click(projeto);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByRole('textbox', { name: 'Frase de posicionamento' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(nicho).toHaveValue('Clínicas odontológicas');
  });
});

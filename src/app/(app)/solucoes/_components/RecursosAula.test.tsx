import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecursosAula } from './RecursosAula';

const recursos = [
  {
    tipo: 'mapa_mental' as const,
    titulo: 'Mapa da conversa',
    descricao: 'Mostra a sequência da entrada até a passagem para uma pessoa.',
    conteudo: 'Entrada → Atendimento → Qualificação → Passagem humana',
  },
  {
    tipo: 'quiz' as const,
    titulo: 'Conversa pronta para construir?',
    descricao: 'Revise os limites antes de configurar as ferramentas do projeto.',
    conteudo:
      '1. Cada estado tem entrada e saída?\n2. A passagem humana tem um responsável?\n\nCorrija o desenho antes de construir.',
  },
  {
    tipo: 'ebook' as const,
    titulo: 'Guia de qualificação',
    descricao: 'Organiza os fatos necessários para decidir o próximo passo comercial.',
    conteudo: 'QUALIFICAÇÃO POR FATOS\n\nRegistre a pergunta, a resposta e a fonte usada.',
  },
  {
    tipo: 'modelo' as const,
    titulo: 'Matriz de qualificação',
    descricao: 'Modelo para documentar a pergunta, a evidência e o efeito na rota.',
    conteudo: 'Critério:\nPergunta:\nEvidência:\nPróximo passo:',
  },
];

describe('recursos da aula', () => {
  it('transforma o mapa mental em uma sequência visual', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[recursos[0]!]} />);

    await user.click(screen.getByText('Ver mapa'));

    const mapa = screen.getByRole('list', { name: 'Etapas do mapa mental' });
    expect(within(mapa).getByText('Entrada')).toBeVisible();
    expect(within(mapa).getByText('Passagem humana')).toBeVisible();
  });

  it('mostra progresso e orientação depois de responder o quiz', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[recursos[1]!]} />);

    await user.click(screen.getByText('Responder quiz'));
    const progresso = screen.getByRole('progressbar', {
      name: 'Progresso do quiz Conversa pronta para construir?',
    });
    expect(progresso).toHaveAttribute('aria-valuenow', '0');

    const primeiraResposta = screen.getByRole('group', {
      name: 'Resposta: Cada estado tem entrada e saída?',
    });
    const segundaResposta = screen.getByRole('group', {
      name: 'Resposta: A passagem humana tem um responsável?',
    });
    await user.click(within(primeiraResposta).getByRole('button', { name: 'Sim' }));
    await user.click(within(segundaResposta).getByRole('button', { name: 'Ainda não' }));

    expect(progresso).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByText('1 ponto pede ajuste.')).toBeVisible();
    expect(screen.getByText('Corrija o desenho antes de construir.')).toBeVisible();
  });

  it('dá tratamento próprio ao guia e mantém o modelo copiável', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[recursos[2]!, recursos[3]!]} />);

    await user.click(screen.getByText('Ler guia'));
    expect(screen.getByRole('heading', { level: 5, name: 'QUALIFICAÇÃO POR FATOS' })).toBeVisible();

    await user.click(screen.getByText('Usar modelo'));
    expect(screen.getByRole('button', { name: 'Copiar Matriz de qualificação' })).toBeVisible();
    expect(screen.getByText(/Critério:/)).toBeVisible();
  });
});

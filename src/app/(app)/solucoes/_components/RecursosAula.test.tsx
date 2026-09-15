import { describe, expect, it, vi } from 'vitest';
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
  it('usa uma lista compacta sem repetir o título e preserva o conteúdo', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[recursos[0]!]} compacto />);
    expect(screen.getByRole('region', { name: 'Recursos desta aula' })).toHaveAttribute(
      'data-compacto',
      'true',
    );
    expect(screen.queryByRole('heading', { name: 'Recursos desta aula' })).toBeNull();
    await user.click(screen.getByText('Mapa da conversa'));
    expect(screen.getByRole('list', { name: 'Etapas do mapa mental' })).toBeVisible();
  });

  it('transforma o mapa mental em uma sequência visual', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[recursos[0]!]} />);

    await user.click(screen.getByText('Mapa da conversa'));

    const mapa = screen.getByRole('list', { name: 'Etapas do mapa mental' });
    expect(within(mapa).getByText('Entrada')).toBeVisible();
    expect(within(mapa).getByText('Passagem humana')).toBeVisible();
  });

  it('mostra progresso e orientação depois de responder o quiz', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[recursos[1]!]} />);

    await user.click(screen.getByText('Conversa pronta para construir?'));
    const progresso = screen.getByRole('progressbar', {
      name: 'Progresso da autoavaliação Conversa pronta para construir?',
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
    expect(screen.getByText('1 ponto para revisar.')).toBeVisible();
    expect(screen.getByText('Corrija o desenho antes de construir.')).toBeVisible();
    expect(screen.getByText('Essa revisão não conclui a aula.')).toBeVisible();
    await user.click(within(segundaResposta).getByRole('button', { name: 'Sim' }));
    expect(screen.getByText('Você marcou todos os pontos como prontos.')).toBeVisible();
    expect(within(segundaResposta).getByRole('button', { name: 'Ainda não' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Refazer autoavaliação' }));
    expect(progresso).toHaveAttribute('aria-valuenow', '0');
    expect(screen.queryByText('Essa revisão não conclui a aula.')).toBeNull();
  });

  it('dá tratamento próprio ao guia e mantém o modelo copiável', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[recursos[2]!, recursos[3]!]} />);

    await user.click(screen.getByText('Guia de qualificação'));
    expect(screen.getByRole('heading', { level: 5, name: 'QUALIFICAÇÃO POR FATOS' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Ler modelo: Matriz de qualificação' }));
    expect(screen.getByRole('button', { name: 'Copiar Matriz de qualificação' })).toBeVisible();
    expect(screen.getByText(/Critério:/)).toBeVisible();
  });

  it('permite copiar e baixar o modelo completo sem abrir o texto', async () => {
    const user = userEvent.setup();
    const escrever = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<RecursosAula recursos={[recursos[3]!]} />);
    const abrir = screen.getByRole('button', { name: 'Ler modelo: Matriz de qualificação' });
    expect(abrir).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: 'Copiar Matriz de qualificação' }));
    expect(escrever).toHaveBeenCalledWith(recursos[3]!.conteudo);
    expect(screen.getByRole('button', { name: 'Copiado Matriz de qualificação' })).toBeVisible();
    const baixar = screen.getByRole('link', { name: 'Baixar .txt: Matriz de qualificação' });
    expect(decodeURIComponent(baixar.getAttribute('href')!.split(',')[1]!)).toBe(
      recursos[3]!.conteudo,
    );
    expect(abrir).toHaveAttribute('aria-expanded', 'false');
  });

  it('mostra orientação antes das respostas e preserva as escolhas ao recolher', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[recursos[1]!]} />);
    const abrir = screen.getByText('Conversa pronta para construir?');
    await user.click(abrir);
    expect(screen.getByText('Corrija o desenho antes de construir.')).toBeVisible();
    const sim = screen.getAllByRole('button', { name: 'Sim' })[0]!;
    await user.click(sim);
    await user.click(abrir);
    await user.click(abrir);
    expect(sim).toHaveAttribute('aria-pressed', 'true');
  });

  it('preserva os detalhes do mapa e o guia no arquivo sem fabricar um PDF', async () => {
    const user = userEvent.setup();
    render(
      <RecursosAula
        recursos={[
          {
            ...recursos[0]!,
            conteudo: 'Entrada\n→ Identificar o canal\n\nPassagem\n- Enviar contexto',
          },
          recursos[2]!,
        ]}
      />,
    );
    await user.click(screen.getByText('Mapa da conversa'));
    expect(screen.getByText('Identificar o canal')).toBeVisible();
    expect(screen.getByText('Enviar contexto')).toBeVisible();
    const baixar = screen.getByRole('link', { name: 'Baixar .txt: Guia de qualificação' });
    expect(baixar).toHaveAttribute('download', 'guia-de-qualificacao.txt');
    expect(decodeURIComponent(baixar.getAttribute('href')!.split(',')[1]!)).toBe(
      recursos[2]!.conteudo,
    );
  });

  it('distingue conteúdo interno do arquivo original externo', async () => {
    const user = userEvent.setup();
    render(<RecursosAula recursos={[{ ...recursos[2]!, url: 'https://example.com/guia.pdf' }]} />);
    const origem = screen.getByRole('link', { name: 'Abrir arquivo original (nova aba)' });
    expect(origem).toHaveAttribute('href', 'https://example.com/guia.pdf');
    expect(origem).toHaveAttribute('rel', 'noopener noreferrer');
    await user.click(screen.getByText('Guia de qualificação'));
    expect(screen.getByText('Registre a pergunta, a resposta e a fonte usada.')).toBeVisible();
  });

  it.each(['javascript:alert(1)', 'data:text/html,teste', 'endereço inválido'])(
    'não torna um destino inválido acionável: %s',
    (url) => {
      render(<RecursosAula recursos={[{ ...recursos[2]!, conteudo: ' ', url }]} />);
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.getByText('O conteúdo deste recurso ainda não foi adicionado.')).toBeVisible();
    },
  );

  it('não cria painel vazio e não fabrica perguntas ausentes', async () => {
    const user = userEvent.setup();
    const { rerender, container } = render(<RecursosAula recursos={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(
      <RecursosAula
        recursos={[{ ...recursos[1]!, conteudo: 'Revise o roteiro com uma pessoa da equipe.' }]}
      />,
    );
    await user.click(screen.getByText('Conversa pronta para construir?'));
    expect(screen.getByText('Revise o roteiro com uma pessoa da equipe.')).toBeVisible();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

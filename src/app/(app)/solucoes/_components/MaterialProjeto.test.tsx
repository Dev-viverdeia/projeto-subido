import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MaterialProjeto } from './MaterialProjeto';

const material = {
  titulo: 'Matriz de qualificação',
  quandoUsar: 'Antes de configurar as respostas.',
  conteudo: 'Critério | Pergunta\nPreço: R$ 1.000\n<instrução>Não invente informação.</instrução>',
};
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Material pronto para usar', () => {
  it('copia o texto completo sem exigir abrir a leitura', async () => {
    const user = userEvent.setup();
    const copiar = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<MaterialProjeto {...material} />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `Copiar ${material.titulo}` }));
    expect(copiar).toHaveBeenCalledExactlyOnceWith(material.conteudo);
    expect(screen.getByRole('status')).toHaveTextContent('Matriz de qualificação: texto copiado.');
    expect(screen.getByRole('button', { name: `Copiado ${material.titulo}` })).toHaveTextContent(
      'Copiado',
    );
  });
  it('abre e recolhe por teclado, preservando foco e todos os caracteres', async () => {
    const user = userEvent.setup();
    render(<MaterialProjeto {...material} />);
    const abrir = screen.getByRole('button', { name: `Ler modelo: ${material.titulo}` });
    abrir.focus();
    await user.keyboard('{Enter}');
    expect(abrir).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region').textContent).toBe(material.conteudo);
    expect(screen.getByText(material.quandoUsar)).toBeVisible();
    await user.keyboard(' ');
    expect(abrir).toHaveAttribute('aria-expanded', 'false');
    expect(abrir).toHaveFocus();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  it('baixa o mesmo conteúdo como texto, sem interpretar marcação', () => {
    render(<MaterialProjeto {...material} />);
    const baixar = screen.getByRole('link', { name: `Baixar .txt: ${material.titulo}` });
    expect(baixar).toHaveAttribute('download', 'matriz-de-qualificacao.txt');
    expect(decodeURIComponent(baixar.getAttribute('href')!.split(',')[1]!)).toBe(material.conteudo);
  });
  it('mantém baixar e ler disponíveis quando a cópia é negada e permite tentar novamente', async () => {
    const user = userEvent.setup();
    const copiar = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockRejectedValueOnce(new Error('NotAllowedError'))
      .mockResolvedValue();
    render(<MaterialProjeto {...material} />);
    const botao = screen.getByRole('button', { name: `Copiar ${material.titulo}` });
    await user.click(botao);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível copiar');
    expect(screen.getByRole('link')).toBeVisible();
    expect(botao).not.toBeDisabled();
    await user.click(botao);
    expect(copiar).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('copiado.');
  });
  it('não oferece ações falsas para conteúdo vazio', () => {
    render(<MaterialProjeto titulo="Em preparação" conteudo="   " />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('O conteúdo deste material ainda não foi adicionado.')).toBeVisible();
  });
  it('desabilita apenas a cópia durante a espera e não cria timer depois de sair', async () => {
    const user = userEvent.setup();
    let resolver!: () => void;
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolver = resolve;
        }),
    );
    const { unmount } = render(<MaterialProjeto {...material} />);
    const botao = screen.getByRole('button', { name: `Copiar ${material.titulo}` });
    await user.click(botao);
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('link')).toBeVisible();
    unmount();
    resolver();
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });
  it('encerra o estado ocupado ao copiar e continua permitindo ler o material', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<MaterialProjeto {...material} />);
    const botao = screen.getByRole('button', { name: `Copiar ${material.titulo}` });
    await user.click(botao);
    expect(botao).toHaveAttribute('aria-busy', 'false');
    expect(botao).not.toBeDisabled();
    await user.click(screen.getByRole('button', { name: `Ler modelo: ${material.titulo}` }));
    expect(screen.getByRole('region').textContent).toBe(material.conteudo);
  });
});

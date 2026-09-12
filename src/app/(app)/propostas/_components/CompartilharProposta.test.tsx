import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import {
  configurarLinkProposta,
  type EstadoCompartilhamento,
} from '@/lib/propostas/compartilhamento-actions';
import { CompartilharProposta } from './CompartilharProposta';

vi.mock('@/lib/propostas/compartilhamento-actions', () => ({ configurarLinkProposta: vi.fn() }));

const BASE: ComponentProps<typeof CompartilharProposta> = {
  propostaId: '11111111-1111-4111-8111-111111111111',
  codigo: '44444444-4444-4444-8444-444444444444',
  siteUrl: 'https://subido.viverdeia.ai',
  empresa: 'Clínica Aurora',
  email: 'camila@example.test',
  projeto: 'Atendimento com IA',
  status: 'apresentada',
  compartilhamento: {
    codigo: '44444444-4444-4444-8444-444444444444',
    ativo: true,
    compartilhadaEm: '2026-09-01T14:00:00Z',
    primeiraVisualizacaoEm: null,
    ultimaVisualizacaoEm: null,
    visualizacoes: 0,
    decisaoNome: null,
    decisaoEmail: null,
    decisaoComentario: null,
    decididaEm: null,
  },
};

beforeEach(() => vi.mocked(configurarLinkProposta).mockReset());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CompartilharProposta', () => {
  it('prioriza o link sem confundir visualizações com entrega do e-mail', async () => {
    const user = userEvent.setup();
    const copiar = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    render(<CompartilharProposta {...BASE} />);
    expect(screen.getByRole('heading', { name: 'Aguardando resposta' })).toBeVisible();
    expect(screen.getByText('Sem visualizações')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Copiar link' }));
    expect(copiar).toHaveBeenCalledWith(`https://subido.viverdeia.ai/proposta/${BASE.codigo}`);
    expect(screen.getByRole('button', { name: 'Copiado' })).toBeVisible();
    const email = screen.getByRole('link', { name: 'Preparar e-mail' });
    expect(email).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:camila@example.test?subject='),
    );
    expect(configurarLinkProposta).not.toHaveBeenCalled();
  });

  it('oferece seleção manual do endereço quando a área de transferência não está disponível', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined as unknown as Clipboard);
    render(<CompartilharProposta {...BASE} />);
    await user.click(screen.getByRole('button', { name: 'Copiar link' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Selecione o link e copie manualmente');
    const input = screen.getByRole('textbox', { name: 'Link da proposta' });
    await user.click(input);
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('readonly');
    expect((input as HTMLInputElement).selectionEnd).toBe((input as HTMLInputElement).value.length);
  });

  it('não compartilha o rascunho como se já estivesse salvo', () => {
    render(<CompartilharProposta {...BASE} alteracoesPendentes />);
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Preparar e-mail' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Salve para compartilhar a versão atual');
    expect(screen.getByRole('link', { name: 'Abrir versão salva' })).toHaveAttribute(
      'href',
      expect.stringContaining(BASE.codigo),
    );
  });

  it.each(['aceita', 'recusada'] as const)(
    'distingue a decisão %s registrada manualmente de uma resposta pelo link',
    (status) => {
      const { rerender } = render(<CompartilharProposta {...BASE} status={status} />);
      expect(
        screen.getByText(
          status === 'aceita' ? 'Aceite registrado na venda' : 'Recusa registrada na venda',
        ),
      ).toBeVisible();
      expect(screen.queryByText('Ver resposta do cliente')).not.toBeInTheDocument();
      rerender(
        <CompartilharProposta
          {...BASE}
          status={status}
          compartilhamento={{
            ...BASE.compartilhamento,
            decisaoNome: 'Camila Rios',
            decisaoComentario: 'Vamos rever o cronograma.',
          }}
        />,
      );
      expect(screen.getByText('Resposta de Camila Rios')).toBeVisible();
      expect(screen.getByText('Ver resposta do cliente')).toBeVisible();
      expect(screen.getByText('Vamos rever o cronograma.')).not.toBeVisible();
    },
  );

  it('só renova após confirmação e usa o código novo nas ações seguintes', async () => {
    const user = userEvent.setup();
    const novoCodigo = '55555555-5555-4555-8555-555555555555';
    vi.mocked(configurarLinkProposta).mockResolvedValue({
      sucesso: 'Novo link criado.',
      codigo: novoCodigo,
      ativo: true,
    });
    render(<CompartilharProposta {...BASE} />);
    await user.click(screen.getByText('Gerenciar acesso'));
    await user.click(screen.getByRole('button', { name: 'Trocar link' }));
    expect(configurarLinkProposta).not.toHaveBeenCalled();
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Criar novo link' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Novo link criado');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const envio = vi.mocked(configurarLinkProposta).mock.calls[0]![1];
    expect([envio.get('id'), envio.get('codigoAtual'), envio.get('operacao')]).toEqual([
      BASE.propostaId,
      BASE.codigo,
      'renovar',
    ]);
    expect(screen.getByLabelText('Link da proposta')).toHaveValue(
      `https://subido.viverdeia.ai/proposta/${novoCodigo}`,
    );
    vi.mocked(configurarLinkProposta).mockRejectedValueOnce(new Error('Falha de rede'));
    await user.click(screen.getByRole('button', { name: 'Desativar link' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar link' }),
    );
    expect(vi.mocked(configurarLinkProposta).mock.calls[1]![1].get('codigoAtual')).toBe(novoCodigo);
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
      'Não conseguimos confirmar',
    );
    expect(screen.getByLabelText('Link da proposta')).toHaveValue(
      `https://subido.viverdeia.ai/proposta/${novoCodigo}`,
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar link' }),
    );
    expect(vi.mocked(configurarLinkProposta).mock.calls[2]![1].get('codigoAtual')).toBe(novoCodigo);
  });

  it('mantém o diálogo bloqueado durante o envio e permite repetir depois de uma falha', async () => {
    const user = userEvent.setup();
    let concluir!: (estado: EstadoCompartilhamento) => void;
    vi.mocked(configurarLinkProposta).mockReturnValue(
      new Promise((resolve) => {
        concluir = resolve;
      }),
    );
    render(<CompartilharProposta {...BASE} />);
    await user.click(screen.getByText('Gerenciar acesso'));
    await user.click(screen.getByRole('button', { name: 'Desativar link' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar link' }),
    );
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeVisible();
    await act(async () => {
      concluir({ erro: 'Não conseguimos atualizar. Tente novamente.' });
      await Promise.resolve();
    });
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
      'Tente novamente',
    );
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar link' }),
    ).toBeEnabled();
    expect(screen.getByLabelText('Link da proposta')).toHaveValue(
      `https://subido.viverdeia.ai/proposta/${BASE.codigo}`,
    );
  });

  it('retira as ações de compartilhamento quando o link é desativado sem mudar a decisão', async () => {
    const user = userEvent.setup();
    vi.mocked(configurarLinkProposta).mockResolvedValue({
      sucesso: 'Link desativado.',
      codigo: BASE.codigo,
      ativo: false,
    });
    render(<CompartilharProposta {...BASE} status="aceita" />);
    await user.click(screen.getByText('Gerenciar acesso'));
    await user.click(screen.getByRole('button', { name: 'Desativar link' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Desativar link' }),
    );
    expect(await screen.findByText('Link desativado', { exact: true })).toBeVisible();
    expect(screen.queryByLabelText('Link da proposta')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Preparar e-mail' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Proposta aceita' })).toBeVisible();
  });
});

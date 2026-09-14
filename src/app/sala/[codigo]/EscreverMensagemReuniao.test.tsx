import { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EscreverMensagemReuniao } from './EscreverMensagemReuniao';

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function montar(enviar = vi.fn().mockResolvedValue(undefined)) {
  const campoRef = createRef<HTMLTextAreaElement>();
  const aoEnviar = vi.fn();
  const props = { aberto: true, conectado: true, campoRef, enviar, enviando: false, aoEnviar };
  const view = render(<EscreverMensagemReuniao {...props} />);
  const campo = screen.getByRole('textbox', { name: 'Mensagem para os participantes' });
  return { ...view, props, campo, enviar, aoEnviar, user: userEvent.setup() };
}

describe('escrita no chat da reunião', () => {
  it('Shift+Enter mantém a quebra e Enter envia o texto completo', async () => {
    const { campo, user, enviar } = montar();
    await user.type(campo, 'Vamos revisar{Shift>}{Enter}{/Shift}o escopo.{Enter}');
    expect(enviar).toHaveBeenCalledExactlyOnceWith('Vamos revisar\no escopo.');
    await waitFor(() => expect(campo).toHaveValue(''));
    expect(screen.getByRole('status')).toHaveTextContent('Enviada');
  });

  it('não envia durante composição, confirmação IME ou repetição de tecla', () => {
    const { campo, enviar } = montar();
    fireEvent.change(campo, { target: { value: 'Texto em composição' } });
    fireEvent.keyDown(campo, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(campo, { key: 'Enter', keyCode: 229 });
    fireEvent.keyDown(campo, { key: 'Enter', repeat: true });
    expect(enviar).not.toHaveBeenCalled();
    expect(campo).toHaveValue('Texto em composição');
  });

  it('no toque, Enter cria linha e Ctrl+Enter permite enviar pelo teclado externo', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );
    const { campo, user, enviar } = montar();
    await user.type(campo, 'Primeira{Enter}Segunda');
    expect(campo).toHaveValue('Primeira\nSegunda');
    expect(enviar).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(enviar).toHaveBeenCalledExactlyOnceWith('Primeira\nSegunda');
  });

  it('não corta uma colagem longa e impede envio até a pessoa revisar', async () => {
    const { campo, user, enviar } = montar();
    const longo = 'a'.repeat(2050);
    await user.click(campo);
    await user.paste(longo);
    expect(campo).toHaveValue(longo);
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Use até 2.000 caracteres.');
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('form'));
    expect(enviar).not.toHaveBeenCalled();
    fireEvent.change(campo, { target: { value: 'a'.repeat(2000) } });
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(enviar).toHaveBeenCalledExactlyOnceWith('a'.repeat(2000));
  });

  it('não envia uma mensagem só de espaços ou quebras de linha', () => {
    const { campo, enviar } = montar();
    fireEvent.change(campo, { target: { value: '  \n  ' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(enviar).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();
  });

  it('protege o envio contra duplicação antes de o SDK atualizar seu estado', async () => {
    const pendente = Promise.withResolvers<void>();
    const { campo, enviar, aoEnviar } = montar(vi.fn(() => pendente.promise));
    fireEvent.change(campo, { target: { value: '  Plano\ncompleto  ' } });
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(enviar).toHaveBeenCalledExactlyOnceWith('Plano\ncompleto');
    expect(campo).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Enviando mensagem' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Enviando…');
    fireEvent.change(campo, { target: { value: 'Não pode substituir durante o envio' } });
    expect(campo).toHaveValue('  Plano\ncompleto  ');
    await act(async () => {
      pendente.resolve();
      await pendente.promise;
    });
    expect(campo).toHaveValue('');
    expect(campo).not.toHaveAttribute('readonly');
    expect(aoEnviar).toHaveBeenCalledOnce();
  });

  it('mantém o texto na falha e só repete quando a pessoa pede', async () => {
    const enviar = vi
      .fn()
      .mockRejectedValueOnce(new Error('segredo-interno'))
      .mockResolvedValue(undefined);
    const { campo, user } = montar(enviar);
    fireEvent.change(campo, { target: { value: 'Contexto\npara o cliente' } });
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A mensagem não foi enviada. Tente novamente.',
    );
    expect(screen.queryByText('segredo-interno')).not.toBeInTheDocument();
    expect(campo).toHaveValue('Contexto\npara o cliente');
    expect(enviar).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(enviar).toHaveBeenLastCalledWith('Contexto\npara o cliente');
    await waitFor(() => expect(campo).toHaveValue(''));
  });

  it('a reconexão mantém o rascunho e não tenta enviar sozinha', async () => {
    const { campo, props, rerender, enviar, user } = montar();
    fireEvent.change(campo, { target: { value: 'Rascunho mantido' } });
    rerender(<EscreverMensagemReuniao {...props} conectado={false} />);
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('form'));
    expect(enviar).not.toHaveBeenCalled();
    expect(campo).toHaveValue('Rascunho mantido');
    rerender(<EscreverMensagemReuniao {...props} />);
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(enviar).toHaveBeenCalledExactlyOnceWith('Rascunho mantido');
  });

  it('um envio que falha após fechar conserva o rascunho para reabrir', async () => {
    const pendente = Promise.withResolvers<void>();
    const { campo, props, rerender } = montar(vi.fn(() => pendente.promise));
    fireEvent.change(campo, { target: { value: 'Não perder este texto' } });
    fireEvent.submit(screen.getByRole('form'));
    rerender(<EscreverMensagemReuniao {...props} aberto={false} />);
    await act(async () => {
      pendente.reject(new Error('Falha'));
      await pendente.promise.catch(() => {});
    });
    rerender(<EscreverMensagemReuniao {...props} />);
    expect(campo).toHaveValue('Não perder este texto');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  });

  it('respeita o foco em outro controle quando o envio termina', async () => {
    const pendente = Promise.withResolvers<void>();
    const { campo, props, rerender, user } = montar(vi.fn(() => pendente.promise));
    rerender(
      <>
        <button>Microfone</button>
        <EscreverMensagemReuniao {...props} />
      </>,
    );
    const atual = screen.getByRole('textbox');
    vi.spyOn(atual, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    fireEvent.change(atual, { target: { value: 'Mensagem' } });
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    await user.click(screen.getByRole('button', { name: 'Microfone' }));
    await act(async () => {
      pendente.resolve();
      await pendente.promise;
    });
    expect(screen.getByRole('button', { name: 'Microfone' })).toHaveFocus();
    expect(campo).not.toHaveFocus();
  });

  it('também respeita o envio em curso sinalizado pelo SDK', () => {
    const { props, rerender, campo, enviar } = montar();
    fireEvent.change(campo, { target: { value: 'Mensagem' } });
    rerender(<EscreverMensagemReuniao {...props} enviando />);
    fireEvent.submit(screen.getByRole('form'));
    expect(enviar).not.toHaveBeenCalled();
    expect(campo).toHaveAttribute('readonly');
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RascunhoReuniao, useRascunhoReuniao } from './RascunhoReuniao';
import { EscreverMensagemReuniao } from './EscreverMensagemReuniao';

function Campo({ enviar }: { enviar: () => Promise<unknown> }) {
  const campoRef = useRef<HTMLTextAreaElement>(null);
  return (
    <EscreverMensagemReuniao
      aberto
      conectado
      campoRef={campoRef}
      enviar={enviar}
      enviando={false}
      aoEnviar={() => {}}
    />
  );
}
function Sala({ enviar }: { enviar: () => Promise<unknown> }) {
  const [montada, montar] = useState(true);
  const { interromper, limpar, aberto, setAberto } = useRascunhoReuniao();
  return (
    <>
      <button
        onClick={() => {
          interromper();
          montar(false);
        }}
      >
        Queda
      </button>
      <button onClick={() => montar(true)}>Retomar</button>
      <button
        onClick={() => {
          limpar();
          montar(false);
        }}
      >
        Sair
      </button>
      <button onClick={() => setAberto(!aberto)}>Painel {aberto ? 'aberto' : 'fechado'}</button>
      {montada && <Campo enviar={enviar} />}
    </>
  );
}

describe('rascunho da participação', () => {
  it('retoma texto multilinha e painel aberto sem enviar nem guardar em disco', () => {
    const enviar = vi.fn();
    const guardar = vi.spyOn(Storage.prototype, 'setItem');
    render(
      <RascunhoReuniao>
        <Sala enviar={enviar} />
      </RascunhoReuniao>,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Escopo\nPrazo' } });
    fireEvent.click(screen.getByText('Painel fechado'));
    fireEvent.click(screen.getByText('Queda'));
    fireEvent.click(screen.getByText('Retomar'));
    expect(screen.getByRole('textbox')).toHaveValue('Escopo\nPrazo');
    expect(screen.getByText('Painel aberto')).toBeVisible();
    expect(enviar).not.toHaveBeenCalled();
    expect(guardar).not.toHaveBeenCalled();
    guardar.mockRestore();
  });
  it.each(['resolver', 'rejeitar'] as const)(
    'retorno tardio %s não apaga o rascunho retomado',
    async (tipo) => {
      let resolver!: () => void;
      let rejeitar!: () => void;
      const enviar = vi.fn(
        () =>
          new Promise<void>((resolve, reject) => {
            resolver = resolve;
            rejeitar = () => reject(new Error('Rede'));
          }),
      );
      render(
        <RascunhoReuniao>
          <Sala enviar={enviar} />
        </RascunhoReuniao>,
      );
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mensagem em envio' } });
      fireEvent.submit(screen.getByRole('form'));
      fireEvent.click(screen.getByText('Queda'));
      fireEvent.click(screen.getByText('Retomar'));
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Confira com os participantes antes de reenviar',
      );
      expect(screen.getByRole('textbox')).toHaveValue('Mensagem em envio');
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mensagem revisada' } });
      await act(async () => {
        if (tipo === 'resolver') resolver();
        else rejeitar();
        await Promise.resolve();
      });
      expect(screen.getByRole('textbox')).toHaveValue('Mensagem revisada');
      expect(enviar).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled();
    },
  );
  it('limpa texto e painel ao sair e nunca transfere para outra sala', () => {
    const view = render(
      <RascunhoReuniao key="a">
        <Sala enviar={vi.fn()} />
      </RascunhoReuniao>,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Rascunho privado' } });
    fireEvent.click(screen.getByText('Sair'));
    fireEvent.click(screen.getByText('Retomar'));
    expect(screen.getByRole('textbox')).toHaveValue('');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Outra tentativa' } });
    view.rerender(
      <RascunhoReuniao key="b">
        <Sala enviar={vi.fn()} />
      </RascunhoReuniao>,
    );
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByText('Painel fechado')).toBeVisible();
  });
});

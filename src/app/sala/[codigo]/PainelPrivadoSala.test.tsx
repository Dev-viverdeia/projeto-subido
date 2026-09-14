import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { limparPosicoesRoteiro } from '@/lib/calls/posicao-roteiro-local';
import { montarPlanoCall } from '@/lib/calls/plano';
import { PainelPrivadoSala } from './PainelPrivadoSala';

const plano = montarPlanoCall({
  tipo: 'descoberta',
  empresa: 'Horizonte',
  oportunidade: 'Atendimento com IA',
  proximaAcao: 'Revisar o piloto.',
  dossie: null,
});

describe('consulta privada do roteiro', () => {
  beforeEach(() => limparPosicoesRoteiro());
  it('retoma após remount sem mover foco, rolar automaticamente ou concluir perguntas', async () => {
    const user = userEvent.setup();
    const painel = (
      <PainelPrivadoSala
        reuniaoId="a"
        plano={plano}
        tipo="descoberta"
        ativo={false}
        gravacao="gravando"
      >
        <p>Acompanhamento</p>
      </PainelPrivadoSala>
    );
    const first = render(painel);
    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    await user.click(screen.getByRole('button', { name: 'Como fechar' }));
    await user.click(screen.getByRole('button', { name: 'Ao vivo' }));
    first.unmount();
    render(painel);
    expect(screen.getByRole('button', { name: 'Ao vivo' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.activeElement).toBe(document.body);
    await user.click(screen.getByRole('button', { name: 'Roteiro' }));
    expect(screen.getByRole('button', { name: 'Como fechar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Perguntas' }));
    expect(screen.getByRole('heading', { name: plano.perguntas[1]!.pergunta })).toBeVisible();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
  it('funciona com coach desligado, mantém posição e não chama APIs', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const montar = vi.fn();
    const desmontar = vi.fn();
    function Acompanhamento() {
      useEffect(() => {
        montar();
        return desmontar;
      }, []);
      return <p>Acompanhamento preservado</p>;
    }
    const user = userEvent.setup();
    const { unmount } = render(
      <PainelPrivadoSala plano={plano} tipo="descoberta" ativo={false} gravacao="gravando">
        <Acompanhamento />
      </PainelPrivadoSala>,
    );
    expect(screen.getByText('Live Coach desligado')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Gravação protegida');
    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    await user.click(screen.getByRole('button', { name: 'Ao vivo' }));
    expect(screen.getByText('Acompanhamento preservado')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Gravação protegida');
    expect(screen.queryByRole('button', { name: 'Próxima pergunta' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Roteiro' }));
    expect(screen.getByRole('heading', { name: plano.perguntas[1]!.pergunta })).toBeVisible();
    expect(montar).toHaveBeenCalledTimes(1);
    expect(desmontar).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    unmount();
    expect(desmontar).toHaveBeenCalledTimes(1);
    fetch.mockRestore();
  });
  it('mantém indisponibilidade real da gravação e ausência de roteiro sem inventar progresso', async () => {
    const user = userEvent.setup();
    render(
      <PainelPrivadoSala plano={null} tipo="descoberta" ativo={false} gravacao="falhou">
        <p>Acompanhamento da sala</p>
      </PainelPrivadoSala>,
    );
    expect(screen.getByRole('heading', { name: 'Roteiro indisponível' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Gravação indisponível');
    await user.click(screen.getByRole('button', { name: 'Ver acompanhamento ao vivo' }));
    expect(screen.getByText('Acompanhamento da sala')).toBeVisible();
  });
  it('mantém abertura e fechamento do kickoff com as perguntas vazias', async () => {
    const user = userEvent.setup();
    render(
      <PainelPrivadoSala
        plano={{ ...plano, perguntas: [] }}
        tipo="kickoff"
        ativo
        gravacao="pendente"
      >
        <p>Ao vivo</p>
      </PainelPrivadoSala>,
    );
    expect(screen.getByText(/Não há perguntas neste roteiro/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Como abrir' }));
    expect(screen.getByText(plano.abertura)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Como fechar' }));
    expect(screen.getByRole('heading', { name: 'Confirmar o acordo' })).toBeVisible();
    expect(screen.getByText(plano.fechamento.proximoPasso)).toBeVisible();
  });
  it('esclarece o limite da privacidade ao compartilhar a tela', async () => {
    const user = userEvent.setup();
    render(
      <PainelPrivadoSala plano={plano} tipo="descoberta" ativo gravacao="gravando">
        <p>Ao vivo</p>
      </PainelPrivadoSala>,
    );
    await user.click(screen.getByText('Privado', { exact: true }));
    expect(screen.getByText(/Se compartilhar a tela inteira, ele poderá vê-lo/)).toBeVisible();
  });
});

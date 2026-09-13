import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { montarPlanoCall } from '@/lib/calls/plano';
import { RoteiroPreparacao } from './RoteiroPreparacao';

const PLANO = montarPlanoCall({
  tipo: 'descoberta',
  empresa: 'Clínica Horizonte',
  oportunidade: 'Atendimento com IA',
  proximaAcao: 'Combinar diagnóstico com Marina.',
  dossie: null,
});

describe('RoteiroPreparacao', () => {
  it('mostra uma pergunta, conserva o texto e revela intenção sob demanda', async () => {
    const user = userEvent.setup();
    render(<RoteiroPreparacao plano={PLANO} kickoff={false} />);
    expect(
      screen.getByRole('heading', { level: 3, name: PLANO.perguntas[0]!.pergunta }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: PLANO.perguntas[1]!.pergunta }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(PLANO.perguntas[0]!.intencao)).not.toBeVisible();
    await user.click(screen.getByText('O que entender'));
    expect(screen.getByText(PLANO.perguntas[0]!.intencao)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pergunta anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    expect(screen.getByRole('heading', { name: PLANO.perguntas[1]!.pergunta })).toBeVisible();
    expect(screen.getByText(PLANO.perguntas[1]!.intencao)).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Pergunta anterior' }));
    expect(screen.getByText('1 de 4')).toBeVisible();
  });

  it('abre o roteiro completo e salta para a pergunta escolhida com foco', async () => {
    const user = userEvent.setup();
    render(<RoteiroPreparacao plano={PLANO} kickoff={false} />);
    await user.click(screen.getByText('Ver todas as perguntas'));
    const lista = screen.getByRole('list', { name: 'Todas as perguntas' });
    expect(within(lista).getAllByRole('button')).toHaveLength(4);
    await user.click(within(lista).getAllByRole('button')[3]!);
    expect(lista).not.toBeVisible();
    expect(screen.getByRole('heading', { name: PLANO.perguntas[3]!.pergunta })).toHaveFocus();
    expect(screen.getByText('4 de 4')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ver fechamento' }));
    expect(screen.getByText(PLANO.fechamento.frase)).toBeVisible();
    expect(screen.getByText(PLANO.fechamento.proximoPasso)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Perguntas' }));
    expect(screen.getByText('4 de 4')).toBeVisible();
  });

  it('permite abrir e fechar sem percorrer perguntas nem registrar conclusão', async () => {
    const user = userEvent.setup();
    render(<RoteiroPreparacao plano={PLANO} kickoff={false} />);
    await user.click(screen.getByRole('button', { name: 'Como abrir' }));
    expect(screen.getByText(PLANO.abertura)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ir para as perguntas' }));
    expect(screen.getByText('1 de 4')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Como fechar' }));
    expect(screen.getByText(PLANO.fechamento.sinalParaAvancar)).toBeVisible();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('mantém abertura e fechamento quando não existem perguntas', async () => {
    const user = userEvent.setup();
    render(<RoteiroPreparacao plano={{ ...PLANO, perguntas: [] }} kickoff />);
    expect(screen.getByText(/Não há perguntas neste roteiro/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Próxima pergunta' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Como fechar' }));
    expect(screen.getByRole('heading', { name: 'Confirmar o acordo' })).toBeVisible();
  });

  it('não perde acesso se o roteiro atualizado tem menos perguntas', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RoteiroPreparacao plano={PLANO} kickoff={false} />);
    await user.click(screen.getByRole('button', { name: 'Próxima pergunta' }));
    rerender(
      <RoteiroPreparacao
        plano={{ ...PLANO, perguntas: PLANO.perguntas.slice(0, 1) }}
        kickoff={false}
      />,
    );
    expect(screen.getByText('1 de 1')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Pergunta anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ver fechamento' })).toBeVisible();
  });

  it('mantém personalização e relação com o projeto sem expor HTML enviado', async () => {
    const user = userEvent.setup();
    const pergunta = {
      ...PLANO.perguntas[0]!,
      pergunta: '<img src=x onerror=alert(1)> Como funciona a troca de turno?',
      projetoRelacionado: 'SDR da unidade Centro',
    };
    const { container } = render(
      <RoteiroPreparacao plano={{ ...PLANO, perguntas: [pergunta] }} kickoff={false} />,
    );
    expect(screen.getByRole('heading', { name: pergunta.pergunta })).toBeVisible();
    expect(container.querySelector('img')).toBeNull();
    await user.click(screen.getByText('O que entender'));
    expect(screen.getByText('Projeto em análise: SDR da unidade Centro')).toBeVisible();
  });
});

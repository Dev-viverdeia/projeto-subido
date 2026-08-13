import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Compositor, type OportunidadeEstudio, type ProjetoBaseEstudio } from './Compositor';

const routerPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

const pedirPerguntas = vi.fn<
  (
    ideia: string,
    contexto: { oportunidade?: string; projetoBase?: string },
  ) => Promise<{ dados: { id: string; perguntas: never[] }; falha: null }>
>(() => Promise.resolve({ dados: { id: 'rascunho-1', perguntas: [] }, falha: null }));

vi.mock('@/lib/builder/invocar', () => ({
  pedirPerguntas: (ideia: string, contexto: { oportunidade?: string; projetoBase?: string }) =>
    pedirPerguntas(ideia, contexto),
}));

const PROJETOS: ProjetoBaseEstudio[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'sdr-atendimento-qualificacao',
    titulo: 'SDR de Atendimento e Qualificação',
    resumo: 'Atendimento conectado e rastreável.',
    resultado: 'Responder, qualificar e encaminhar os contatos certos.',
  },
];

const OPORTUNIDADES: OportunidadeEstudio[] = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Atendimento no WhatsApp',
    empresa: 'Clínica Aurora',
    contato: 'Camila Rios',
  },
];

beforeEach(() => {
  pedirPerguntas.mockClear();
  routerPush.mockClear();
});

describe('Compositor', () => {
  it('exige um Projeto-base antes de liberar a personalização', async () => {
    const user = userEvent.setup();
    render(<Compositor projetosBase={PROJETOS} oportunidades={OPORTUNIDADES} />);

    await user.type(
      screen.getByRole('textbox'),
      'O cliente perde conversas quando troca o atendente responsável.',
    );
    expect(screen.getByRole('button', { name: 'Formular o projeto' })).toBeDisabled();

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Projeto-base/ }),
      PROJETOS[0]!.id,
    );
    expect(screen.getByRole('button', { name: 'Formular o projeto' })).toBeEnabled();
  });

  it('leva Projeto, cliente e dor real para o rascunho e preserva os vínculos', async () => {
    const user = userEvent.setup();
    render(
      <Compositor
        projetosBase={PROJETOS}
        oportunidades={OPORTUNIDADES}
        projetoInicialId={PROJETOS[0]!.id}
        oportunidadeInicialId={OPORTUNIDADES[0]!.id}
      />,
    );

    await user.type(
      screen.getByRole('textbox'),
      'Hoje cinco atendentes respondem sem histórico compartilhado e duplicam perguntas.',
    );
    await user.click(screen.getByRole('button', { name: 'Formular o projeto' }));

    await waitFor(() => expect(pedirPerguntas).toHaveBeenCalledTimes(1));
    expect(pedirPerguntas).toHaveBeenCalledWith(
      expect.stringContaining('Projeto-base: SDR de Atendimento e Qualificação.'),
      {
        projetoBase: PROJETOS[0]!.id,
        oportunidade: OPORTUNIDADES[0]!.id,
      },
    );
    expect(pedirPerguntas.mock.calls[0]?.[0]).toContain('Cliente: Clínica Aurora.');
    expect(pedirPerguntas.mock.calls[0]?.[0]).toContain('histórico compartilhado');
    await waitFor(() => expect(routerPush).toHaveBeenCalledWith('/builder/rascunho-1'));
  });
});

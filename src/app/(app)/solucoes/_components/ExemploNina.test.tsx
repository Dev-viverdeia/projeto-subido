import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/app/preview/nina/fixture.json';
import { lerRoteiroProjeto } from '@/lib/projetos/roteiro';
import { ContextoProgresso } from '@/lib/progresso/local';
import { PROGRESSO_VAZIO } from '@/lib/progresso/estado';
import { exemplosPassosNina, NINA_SLUG } from '@/lib/projetos/exemplos-nina';
import { ExemploNina } from './ExemploNina';
import { GuiaExecucaoPasso } from './GuiaExecucaoPasso';
import { AprendizadoProjeto } from './AprendizadoProjeto';
import { ImplementacaoProjeto } from './ImplementacaoProjeto';

const roteiro = lerRoteiroProjeto(fixture.roteiro)!;
const passo = roteiro.fases[0]!.passos[0]!;

describe('Leitura visual da Nina', () => {
  it('troca cenários pelo teclado e identifica o conteúdo como exemplo', async () => {
    const user = userEvent.setup();
    render(<ExemploNina exemplo={exemplosPassosNina['registrar-responder']} />);
    expect(screen.getByText('Exemplo didático')).toBeVisible();
    const semFonte = screen.getByRole('button', { name: 'Sem fonte' });
    semFonte.focus();
    await user.keyboard('{Enter}');
    expect(semFonte).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Vocês fazem desconto de 20%?')).toBeVisible();
    expect(screen.getByText(/Não inventar preço ou desconto/)).toBeVisible();
    expect(screen.queryByText('Qual é o horário de atendimento?')).toBeNull();
  });
  it('começa pelo exemplo sem esconder instruções, critérios ou modelos', async () => {
    const user = userEvent.setup();
    render(
      <GuiaExecucaoPasso
        passo={passo}
        concluido={false}
        exemplo={exemplosPassosNina['mapear-jornada']}
      />,
    );
    expect(screen.getByRole('button', { name: 'Exemplo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('list', { name: 'Caminho esperado' }).children).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: 'Preparar este passo' }));
    expect(screen.getByText(passo.insumos[0]!)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ir para execução' }));
    expect(screen.getByRole('region', { name: 'Ação em foco' })).toHaveTextContent(
      passo.execucao[0]!,
    );
    await user.click(screen.getByText('Orientação deste passo', { selector: 'summary' }));
    expect(screen.getByText(passo.acao)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Conferir' }));
    expect(screen.getByText(passo.concluidoQuando)).toBeVisible();
    await user.click(screen.getByText(passo.modelo!.titulo));
    expect(screen.getByRole('region', { name: `Modelo: ${passo.modelo!.titulo}` })).toBeVisible();
  });
  it('abre conferência ao revisitar um passo concluído', () => {
    render(
      <GuiaExecucaoPasso passo={passo} concluido exemplo={exemplosPassosNina['mapear-jornada']} />,
    );
    expect(screen.getByRole('button', { name: 'Conferir' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByText('Exemplo didático')).toBeNull();
  });
  it('consultar passos e exemplos não grava progresso; concluir continua explícito', async () => {
    const user = userEvent.setup();
    const alternarEtapa = vi.fn();
    render(
      <ContextoProgresso
        value={{
          estado: PROGRESSO_VAZIO,
          acoes: { alternarEtapa, concluirAula: vi.fn(), tocarFormacao: vi.fn() },
        }}
      >
        <ImplementacaoProjeto slug={NINA_SLUG} roteiro={roteiro} onIrMateriais={vi.fn()} />
      </ContextoProgresso>,
    );
    await user.click(screen.getByRole('button', { name: 'Executar' }));
    await user.click(screen.getByRole('button', { name: 'Conferir' }));
    expect(alternarEtapa).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: `Concluir: ${passo.titulo}` }));
    expect(alternarEtapa).toHaveBeenCalledExactlyOnceWith(
      `projeto:${NINA_SLUG}:entender:mapear-jornada`,
      NINA_SLUG,
    );
  });
  it('troca a aula sem levar o cenário anterior e preserva exercícios e recursos', async () => {
    const user = userEvent.setup();
    const alternarEtapa = vi.fn();
    render(
      <ContextoProgresso
        value={{
          estado: PROGRESSO_VAZIO,
          acoes: { alternarEtapa, concluirAula: vi.fn(), tocarFormacao: vi.fn() },
        }}
      >
        <AprendizadoProjeto
          slug={NINA_SLUG}
          titulo="Nina"
          trilha={roteiro.trilhaDidatica!}
          videoUrl={null}
        />
      </ContextoProgresso>,
    );
    await user.click(screen.getByRole('button', { name: 'Encaminhar' }));
    const aulas = within(screen.getByRole('navigation', { name: 'Aulas do projeto' }));
    await user.click(aulas.getByRole('button', { name: /^Aula 3:/ }));
    expect(screen.getByRole('button', { name: 'Falta informação' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(roteiro.trilhaDidatica!.aulas[2]!.exercicio)).toBeVisible();
    await user.click(screen.getByText('Recursos desta aula', { selector: 'summary' }));
    expect(screen.getByText(roteiro.trilhaDidatica!.aulas[2]!.recursos[0]!.titulo)).toBeVisible();
    expect(alternarEtapa).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Concluir aula' }));
    expect(alternarEtapa).toHaveBeenCalledExactlyOnceWith(
      `projeto:${NINA_SLUG}:aprender:aula-03`,
      NINA_SLUG,
    );
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/app/preview/reunioes-projeto/fixture.json';
import { lerRoteiroProjeto } from '@/lib/projetos/roteiro';
import { ContextoProgresso } from '@/lib/progresso/local';
import { PROGRESSO_VAZIO } from '@/lib/progresso/estado';
import { exemplosPassosReunioes, REUNIOES_SLUG } from '@/lib/projetos/exemplos-reunioes';
import { ExemploProjeto } from './ExemploProjeto';
import { AprendizadoProjeto } from './AprendizadoProjeto';
import { ImplementacaoProjeto } from './ImplementacaoProjeto';

const roteiro = lerRoteiroProjeto(fixture.roteiro)!;
const contexto = (alternarEtapa = vi.fn()) => ({
  estado: PROGRESSO_VAZIO,
  acoes: { alternarEtapa, concluirAula: vi.fn(), tocarFormacao: vi.fn() },
});

describe('Leitura visual de reuniões', () => {
  it('compara fala, resumo e tarefa pelo teclado, sem simular envio', async () => {
    const user = userEvent.setup();
    render(<ExemploProjeto exemplo={exemplosPassosReunioes['gerar-pos-call']} />);
    expect(screen.getByText('Exemplo didático')).toBeVisible();
    expect(screen.getByRole('list', { name: 'Trechos simulados da reunião' })).toBeVisible();
    expect(screen.getByText('Acordo na conversa')).toBeVisible();
    const semPrazo = screen.getByRole('button', { name: 'Sem prazo' });
    semPrazo.focus();
    await user.keyboard('{Enter}');
    expect(semPrazo).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Dados a confirmar')).toBeVisible();
    expect(screen.getByText('Não combinado')).toBeVisible();
    expect(screen.queryByText('12 de setembro')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Só uma sugestão' }));
    expect(screen.getByText('Nenhuma tarefa combinada neste trecho')).toBeVisible();
    expect(screen.getByText('Não definido')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Enviar|Criar tarefa/ })).toBeNull();
  });
  it('o coach fica em silêncio quando o ponto foi resolvido ou o áudio é incerto', async () => {
    const user = userEvent.setup();
    render(<ExemploProjeto exemplo={exemplosPassosReunioes['transcrever-coachear']} />);
    await user.click(screen.getByRole('button', { name: 'Já respondido' }));
    expect(screen.getByText('Nenhuma dica. O vendedor já avançou neste ponto.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Áudio incerto' }));
    expect(
      screen.getByText('Nenhuma dica baseada neste trecho. Sinalizar a falha de transcrição.'),
    ).toBeVisible();
  });
  it('ler, trocar cenários e preparar não grava progresso; concluir mantém o ID real', async () => {
    const user = userEvent.setup();
    const valor = contexto();
    render(
      <ContextoProgresso value={valor}>
        <ImplementacaoProjeto slug={REUNIOES_SLUG} roteiro={roteiro} onIrMateriais={vi.fn()} />
      </ContextoProgresso>,
    );
    await user.click(
      within(screen.getByRole('navigation', { name: 'Fases do projeto' })).getByRole('button', {
        name: /Construir/,
      }),
    );
    await user.click(screen.getByRole('button', { name: /Gerar fatos, tarefas e follow-up/ }));
    await user.click(screen.getByRole('button', { name: 'Sem prazo' }));
    await user.click(screen.getByRole('button', { name: 'Preparar este passo' }));
    expect(screen.getByText('Transcrição final')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ir para execução' }));
    expect(valor.acoes.alternarEtapa).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Concluir: Gerar fatos, tarefas e follow-up' }),
    );
    expect(valor.acoes.alternarEtapa).toHaveBeenCalledExactlyOnceWith(
      `projeto:${REUNIOES_SLUG}:construir:gerar-pos-call`,
      REUNIOES_SLUG,
    );
  });
  it('trocar de aula reseta o cenário, preserva recursos e exige conclusão explícita', async () => {
    const user = userEvent.setup();
    const valor = contexto();
    render(
      <ContextoProgresso value={valor}>
        <AprendizadoProjeto
          slug={REUNIOES_SLUG}
          titulo="Assistente de reuniões com IA"
          trilha={roteiro.trilhaDidatica!}
          videoUrl={null}
        />
      </ContextoProgresso>,
    );
    const aulas = within(screen.getByRole('navigation', { name: 'Aulas do projeto' }));
    await user.click(aulas.getByRole('button', { name: /^Aula 3:/ }));
    await user.click(screen.getByRole('button', { name: 'Só uma sugestão' }));
    await user.click(aulas.getByRole('button', { name: /^Aula 2:/ }));
    await user.click(aulas.getByRole('button', { name: /^Aula 3:/ }));
    expect(screen.getByRole('button', { name: 'Combinado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(roteiro.trilhaDidatica!.aulas[2]!.exercicio)).toBeVisible();
    await user.click(screen.getByText('Recursos desta aula', { selector: 'summary' }));
    expect(screen.getByText('Ficha factual pós-call')).toBeVisible();
    expect(valor.acoes.alternarEtapa).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Concluir aula' }));
    expect(valor.acoes.alternarEtapa).toHaveBeenCalledExactlyOnceWith(
      `projeto:${REUNIOES_SLUG}:aprender:aula-03`,
      REUNIOES_SLUG,
    );
  });
});

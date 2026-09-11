import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/app/preview/nina/fixture.json';
import { idsPassosProjeto, lerRoteiroProjeto } from '@/lib/projetos/roteiro';
import { ContextoProgresso } from '@/lib/progresso/local';
import { PROGRESSO_VAZIO } from '@/lib/progresso/estado';
import { ImplementacaoProjeto } from './ImplementacaoProjeto';

const roteiro = lerRoteiroProjeto(fixture.roteiro)!;
const slug = 'sdr-atendimento-qualificacao';
const ids = idsPassosProjeto(slug, roteiro);
const tarefas = roteiro.fases.flatMap((fase) => fase.passos);
const concluir = vi.fn();
const materiais = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

function montar(completo = false) {
  function Cenário() {
    const [estado, setEstado] = useState({
      ...PROGRESSO_VAZIO,
      etapas: completo ? Object.fromEntries(ids.map((id) => [id, '2026-09-08T12:00:00Z'])) : {},
    });
    return (
      <ContextoProgresso
        value={{
          estado,
          acoes: {
            concluirAula: vi.fn(),
            tocarFormacao: vi.fn(),
            alternarEtapa: (id, projetoSlug) => {
              concluir(id, projetoSlug);
              setEstado((anterior) => {
                const etapas = { ...anterior.etapas };
                if (etapas[id]) delete etapas[id];
                else etapas[id] = '2026-09-08T12:00:00Z';
                return { ...anterior, etapas };
              });
            },
          },
        }}
      >
        <ImplementacaoProjeto slug={slug} roteiro={roteiro} onIrMateriais={materiais} />
      </ContextoProgresso>
    );
  }
  return render(<Cenário />);
}

describe('Navegação da implementação', () => {
  it('percorre cada passo antes de mudar de fase, sem concluir tarefas ao navegar', async () => {
    const user = userEvent.setup();
    montar();
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Próximo passo' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: tarefas[1]!.titulo, level: 3 })).toHaveFocus(),
    );
    expect(screen.getByRole('combobox')).toHaveValue('entender');
    await user.click(screen.getByRole('button', { name: 'Próximo passo' }));
    expect(screen.getByRole('heading', { name: tarefas[2]!.titulo, level: 3 })).toBeVisible();
    expect(screen.getByRole('combobox')).toHaveValue('preparar');
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getByRole('combobox')).toHaveValue('entender');
    expect(screen.getByRole('heading', { name: tarefas[1]!.titulo, level: 3 })).toBeVisible();
    expect(concluir).not.toHaveBeenCalled();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('seleciona qualquer fase, abre a lista e recolhe após escolher um passo', async () => {
    const user = userEvent.setup();
    montar();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Escolher fase do projeto' }),
      'construir',
    );
    // JSDOM não calcula container queries; visibilidade móvel é verificada no navegador.
    const abrir = screen.getByText('Ver passos').closest('button')!;
    expect(abrir).toHaveAttribute('aria-expanded', 'false');
    await user.click(abrir);
    expect(abrir).toHaveAttribute('aria-expanded', 'true');
    const lista = screen.getByRole('navigation', { name: 'Passos da fase Construir' });
    await user.click(within(lista).getByRole('button', { name: tarefas[5]!.titulo }));
    expect(screen.getByText('Ver passos').closest('button')).toHaveTextContent('Passo 2 de 2');
    expect(screen.getByText('Ver passos').closest('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: tarefas[5]!.titulo })).toHaveFocus(),
    );
    expect(concluir).not.toHaveBeenCalled();
  });

  it('concluir atualiza o progresso, mantém o resultado e só avança com ação explícita', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: `Concluir: ${tarefas[0]!.titulo}` }));
    expect(concluir).toHaveBeenCalledExactlyOnceWith(ids[0], slug);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      '1 de 10 passos concluídos',
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: tarefas[0]!.titulo })).toHaveFocus(),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Passo concluído');
    await user.click(screen.getByRole('button', { name: 'Próximo passo' }));
    expect(screen.getByRole('heading', { level: 3, name: tarefas[1]!.titulo })).toBeVisible();
    expect(concluir).toHaveBeenCalledTimes(1);
  });

  it('distingue fases concluídas e permite reabrir somente o passo escolhido', async () => {
    const user = userEvent.setup();
    montar(true);
    const nav = screen.getByRole('navigation', { name: 'Fases do projeto' });
    expect(within(nav).getAllByRole('button', { name: /Concluída/ })).toHaveLength(5);
    expect(screen.getAllByRole('option', { name: /Concluída/ })).toHaveLength(5);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    await user.click(screen.getByRole('button', { name: `Reabrir: ${tarefas[0]!.titulo}` }));
    expect(concluir).toHaveBeenCalledExactlyOnceWith(ids[0], slug);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '90');
    expect(within(nav).getByRole('button', { name: /Entender/ })).toHaveTextContent(
      '1 de 2 passos',
    );
    expect(screen.getByRole('button', { name: `Concluir: ${tarefas[0]!.titulo}` })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('só oferece o kit no último passo e mantém o retorno disponível', async () => {
    const user = userEvent.setup();
    montar();
    await user.selectOptions(screen.getByRole('combobox'), 'entregar');
    expect(screen.queryByRole('button', { name: 'Ver materiais' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Próximo passo' }));
    expect(screen.queryByRole('button', { name: 'Próximo passo' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ver materiais' }));
    expect(materiais).toHaveBeenCalledOnce();
    expect(concluir).not.toHaveBeenCalled();
  });
});

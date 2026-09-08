import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/app/preview/nina/fixture.json';
import { idAulaProjeto, lerRoteiroProjeto } from '@/lib/projetos/roteiro';
import { ContextoProgresso } from '@/lib/progresso/local';
import { PROGRESSO_VAZIO } from '@/lib/progresso/estado';
import { AprendizadoProjeto } from './AprendizadoProjeto';

const trilha = lerRoteiroProjeto(fixture.roteiro)!.trilhaDidatica!;
const slug = 'sdr-atendimento-qualificacao';
const ids = trilha.aulas.map((_, indice) => idAulaProjeto(slug, indice));
const salvar = vi.fn();
const implementar = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

function montar(concluidas: number[] = []) {
  function Cenario() {
    const [estado, setEstado] = useState({
      ...PROGRESSO_VAZIO,
      etapas: Object.fromEntries(
        concluidas.map((indice) => [ids[indice]!, '2026-09-08T12:00:00Z']),
      ),
    });
    return (
      <ContextoProgresso
        value={{
          estado,
          acoes: {
            concluirAula: vi.fn(),
            tocarFormacao: vi.fn(),
            alternarEtapa: (id, projetoSlug) => {
              salvar(id, projetoSlug);
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
        <AprendizadoProjeto
          slug={slug}
          titulo="Atendimento no WhatsApp com IA"
          trilha={trilha}
          videoUrl={null}
          onIrImplementacao={implementar}
        />
      </ContextoProgresso>
    );
  }
  return render(<Cenario />);
}

const titulo = (indice: number) =>
  screen.getByRole('heading', { level: 3, name: trilha.aulas[indice]!.titulo });
const recursos = () =>
  screen.getByText('Recursos desta aula', { selector: 'summary' }).closest('details')!;

describe('Aula em foco', () => {
  it('navega em ordem sem concluir aulas e traz o foco ao título', async () => {
    const user = userEvent.setup();
    montar();
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Próxima aula' }));
    await waitFor(() => expect(titulo(1)).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Próxima aula' }));
    expect(titulo(2)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Próxima aula' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(titulo(1)).toBeVisible();
    expect(salvar).not.toHaveBeenCalled();
  });

  it('fecha o índice ao escolher uma aula e reinicia os recursos da nova aula', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(within(recursos()).getByText('Recursos desta aula', { selector: 'summary' }));
    expect(recursos()).toHaveAttribute('open');
    // JSDOM não calcula container queries. A visibilidade móvel é conferida no navegador.
    const abrir = screen.getByText('Ver aulas').closest('button')!;
    await user.click(abrir);
    expect(abrir).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: /^Aula 2:/ }));
    expect(screen.getByText('Ver aulas').closest('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('Ver aulas').closest('button')).toHaveTextContent('Aula 2 de 3');
    expect(recursos()).not.toHaveAttribute('open');
    await waitFor(() => expect(titulo(1)).toHaveFocus());
    expect(salvar).not.toHaveBeenCalled();
  });

  it('conclui somente a aula atual e segue para a próxima pendente', async () => {
    const user = userEvent.setup();
    montar([1]);
    await user.click(screen.getByRole('button', { name: 'Concluir aula' }));
    expect(salvar).toHaveBeenCalledExactlyOnceWith(ids[0], slug);
    await waitFor(() => expect(titulo(2)).toHaveFocus());
    expect(screen.getByRole('progressbar', { name: 'Progresso do aprendizado' })).toHaveAttribute(
      'aria-valuetext',
      '2 de 3 aulas concluídas',
    );
  });

  it('permanece na última aula pendente ao terminar, sem voltar para a primeira', async () => {
    const user = userEvent.setup();
    montar([0, 1]);
    expect(titulo(2)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Concluir aula' }));
    await waitFor(() => expect(titulo(2)).toHaveFocus());
    expect(screen.getByRole('progressbar', { name: 'Progresso do aprendizado' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('button', { name: 'Reabrir aula' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Ir para implementação' }));
    expect(implementar).toHaveBeenCalledOnce();
    expect(salvar).toHaveBeenCalledExactlyOnceWith(ids[2], slug);
  });

  it('reabre a aula escolhida sem alterar as outras conclusões', async () => {
    const user = userEvent.setup();
    montar([0, 1, 2]);
    const nav = screen.getByRole('navigation', { name: 'Aulas do projeto' });
    expect(within(nav).getAllByRole('button', { name: /Concluída/ })).toHaveLength(3);
    await user.click(within(nav).getByRole('button', { name: /^Aula 2:/ }));
    await user.click(screen.getByRole('button', { name: 'Reabrir aula' }));
    expect(salvar).toHaveBeenCalledExactlyOnceWith(ids[1], slug);
    expect(titulo(1)).toBeVisible();
    expect(within(nav).getAllByRole('button', { name: /Concluída/ })).toHaveLength(2);
    expect(screen.getByRole('progressbar', { name: 'Progresso do aprendizado' })).toHaveAttribute(
      'aria-valuetext',
      '2 de 3 aulas concluídas',
    );
    expect(screen.queryByRole('complementary', { name: 'Aprendizado concluído' })).toBeNull();
  });

  it('mantém o vídeo do projeto carregado ao trocar aula', async () => {
    const user = userEvent.setup();
    const { container } = montar();
    expect(container.querySelector('iframe')).toBeNull();
    await user.click(screen.getAllByRole('button', { name: /^Assistir:/ })[0]!);
    const video = container.querySelector('iframe');
    expect(video).toHaveAttribute('src', trilha.videosReferencia[0]!.videoUrl);
    await user.click(screen.getByRole('button', { name: 'Próxima aula' }));
    expect(container.querySelector('iframe')).toBe(video);
    expect(screen.getByText('Vídeo do projeto')).toBeVisible();
    expect(salvar).not.toHaveBeenCalled();
  });
});

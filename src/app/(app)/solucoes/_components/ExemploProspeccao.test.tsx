import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fixture from '@/app/preview/prospeccao-projeto/fixture.json';
import { lerRoteiroProjeto } from '@/lib/projetos/roteiro';
import { ContextoProgresso } from '@/lib/progresso/local';
import { PROGRESSO_VAZIO } from '@/lib/progresso/estado';
import { exemplosPassosProspeccao, PROSPECCAO_SLUG } from '@/lib/projetos/exemplos-prospeccao';
import { exemploAulaProjeto, exemploPassoProjeto } from '@/lib/projetos/exemplos';
import { ExemploProjeto } from './ExemploProjeto';
import { AprendizadoProjeto } from './AprendizadoProjeto';
import { ImplementacaoProjeto } from './ImplementacaoProjeto';

const roteiro = lerRoteiroProjeto(fixture.roteiro)!;

beforeEach(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

describe('Leitura visual de prospecção', () => {
  it('distingue falta de perfil de informação ausente, inclusive pelo teclado', async () => {
    const user = userEvent.setup();
    render(<ExemploProjeto exemplo={exemplosPassosProspeccao['traduzir-icp']} />);
    expect(screen.getByText('Empresa fictícia')).toBeVisible();
    expect(screen.getByText('Pesquisar esta conta')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Fora do perfil' }));
    expect(screen.getByText('Descartar deste lote')).toBeVisible();
    const incompletos = screen.getByRole('button', { name: 'Dados incompletos' });
    incompletos.focus();
    await user.keyboard('{Enter}');
    expect(incompletos).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Revisar antes de decidir')).toBeVisible();
    expect(screen.getByText('A confirmar')).toBeVisible();
    expect(screen.queryByText('Descartar deste lote')).toBeNull();
  });
  it('rascunho e opt-out não oferecem um comando de envio', async () => {
    const user = userEvent.setup();
    render(<ExemploProjeto exemplo={exemplosPassosProspeccao['pontuar-briefar']} />);
    expect(screen.getByText('Rascunho para revisão')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Contato recusado' }));
    expect(screen.getByText('Não preparar um novo contato para envio.')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Enviar/ })).toBeNull();
  });
  it('leitura não altera progresso, mas a conclusão usa o mesmo ID do currículo', async () => {
    const user = userEvent.setup();
    const alternarEtapa = vi.fn();
    render(
      <ContextoProgresso
        value={{
          estado: PROGRESSO_VAZIO,
          acoes: { alternarEtapa, concluirAula: vi.fn(), tocarFormacao: vi.fn() },
        }}
      >
        <ImplementacaoProjeto slug={PROSPECCAO_SLUG} roteiro={roteiro} onIrMateriais={vi.fn()} />
      </ContextoProgresso>,
    );
    await user.click(screen.getByRole('button', { name: 'Dados incompletos' }));
    await user.click(screen.getByRole('button', { name: 'Preparar este passo' }));
    expect(screen.getByText(roteiro.fases[0]!.passos[0]!.insumos[0]!)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Ir para execução' }));
    expect(alternarEtapa).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Concluir: Traduzir o ICP em filtros' }));
    expect(alternarEtapa).toHaveBeenCalledExactlyOnceWith(
      `projeto:${PROSPECCAO_SLUG}:entender:traduzir-icp`,
      PROSPECCAO_SLUG,
    );
  });
  it('trocar aula reseta a análise sem marcar a aula como concluída', async () => {
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
          slug={PROSPECCAO_SLUG}
          titulo="Prospecção de clientes com IA"
          trilha={roteiro.trilhaDidatica!}
          videoUrl={null}
        />
      </ContextoProgresso>,
    );
    const aulas = within(screen.getByRole('navigation', { name: 'Aulas do projeto' }));
    await user.click(screen.getByRole('button', { name: 'Dados incompletos' }));
    await user.click(aulas.getByRole('button', { name: /^Aula 2:/ }));
    await user.click(aulas.getByRole('button', { name: /^Aula 1:/ }));
    expect(screen.getByRole('button', { name: 'Com perfil' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(alternarEtapa).not.toHaveBeenCalled();
  });
  it('seleciona os projetos de forma isolada e mantém o fallback de conteúdo desconhecido', () => {
    expect(exemploPassoProjeto(PROSPECCAO_SLUG, 'traduzir-icp')).not.toBeNull();
    expect(exemploPassoProjeto('sdr-atendimento-qualificacao', 'mapear-jornada')).not.toBeNull();
    expect(exemploPassoProjeto(PROSPECCAO_SLUG, 'mapear-jornada')).toBeNull();
    expect(
      exemploAulaProjeto(PROSPECCAO_SLUG, 'Desenhe a conversa antes de configurar o agente'),
    ).toBeNull();
    expect(exemploAulaProjeto('outro', '__proto__')).toBeNull();
  });
});

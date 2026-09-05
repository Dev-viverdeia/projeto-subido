import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContextoProgresso } from '@/lib/progresso/local';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import type { EstadoProgressoConta } from '@/lib/progresso/local';
import { selecionarProximaFormacao, TrilhaFormacoes } from './TrilhaFormacoes';

function formacao(slug: string, aulaIds: string[]): FormacaoResumo {
  return {
    id: slug,
    slug,
    titulo: slug,
    resumo: '',
    capa_url: null,
    publicado_em: null,
    criado_em: '2026-08-21T00:00:00.000Z',
    modulos: 1,
    aulas: aulaIds.length,
    aulaIds,
  };
}

function progresso(
  aulas: string[] = [],
  formacoes: Record<string, string> = {},
): EstadoProgressoConta {
  return {
    aulas: Object.fromEntries(aulas.map((id) => [id, '2026-08-21T00:00:00.000Z'])),
    formacoes,
    etapas: {},
    solucoes: {},
  };
}

const TRILHA = [formacao('base', ['a1', 'a2']), formacao('agentes', ['b1', 'b2'])];

function mostrar(formacoes: FormacaoResumo[], estado = progresso()) {
  render(
    <ContextoProgresso.Provider
      value={{
        estado,
        acoes: {
          concluirAula: () => undefined,
          tocarFormacao: () => undefined,
          alternarEtapa: () => undefined,
        },
      }}
    >
      <TrilhaFormacoes formacoes={formacoes} />
    </ContextoProgresso.Provider>,
  );
}

describe('próxima formação da trilha', () => {
  it('começa pela primeira formação quando não há progresso', () => {
    expect(selecionarProximaFormacao(TRILHA, progresso())?.slug).toBe('base');
  });

  it('prioriza a formação em andamento mais recente', () => {
    const estado = progresso(['b1'], { agentes: '2026-08-21T12:00:00.000Z' });
    expect(selecionarProximaFormacao(TRILHA, estado)?.slug).toBe('agentes');
  });

  it('avança quando a formação anterior foi concluída', () => {
    expect(selecionarProximaFormacao(TRILHA, progresso(['a1', 'a2']))?.slug).toBe('agentes');
  });

  it('encerra quando todas as formações foram concluídas', () => {
    expect(selecionarProximaFormacao(TRILHA, progresso(['a1', 'a2', 'b1', 'b2']))).toBeNull();
  });

  it('não recomenda outra formação do zero quando ainda há uma em andamento', () => {
    const estado = progresso(['b1'], { base: '2026-09-05T12:00:00.000Z' });
    expect(selecionarProximaFormacao(TRILHA, estado)?.slug).toBe('agentes');
  });

  it('não oferece começar uma formação sem aulas', () => {
    const itens = [formacao('sem-aulas', []), ...TRILHA];
    expect(selecionarProximaFormacao(itens, progresso())?.slug).toBe('base');
    mostrar([itens[0]!]);
    expect(screen.getByRole('link', { name: /Ver formação/ })).toHaveAttribute(
      'href',
      '/formacoes/sem-aulas',
    );
    expect(screen.queryByText('Formações concluídas')).not.toBeInTheDocument();
    expect(screen.queryByText('Comece aqui')).not.toBeInTheDocument();
  });

  it('apresenta cada curso uma vez para quem ainda não começou', () => {
    mostrar(TRILHA);
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getAllByText('Comece aqui')).toHaveLength(1);
    expect(screen.queryByText('Continue de onde parou')).not.toBeInTheDocument();
  });

  it('retoma a formação com o progresso real', () => {
    mostrar(TRILHA, progresso(['b1']));
    const retomar = screen.getByRole('link', { name: /Continue de onde parou/ });
    expect(retomar).toHaveAttribute('href', '/formacoes/agentes');
    expect(retomar).toHaveTextContent('1 de 2 aulas concluídas');
  });

  it('celebra a conclusão sem sugerir começar de novo', () => {
    mostrar(TRILHA, progresso(['a1', 'a2', 'b1', 'b2']));
    expect(screen.getByRole('status')).toHaveTextContent('Formações concluídas');
    expect(screen.getAllByRole('link', { name: /Revisar formação/ })).toHaveLength(2);
    expect(screen.queryByText('Comece aqui')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver projetos/ })).toHaveAttribute('href', '/solucoes');
  });

  it('orienta o estado vazio sem anunciar uma trilha concluída', () => {
    mostrar([]);
    expect(
      screen.getByRole('heading', { name: 'Nenhuma formação disponível' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/0 formações/)).not.toBeInTheDocument();
  });
});

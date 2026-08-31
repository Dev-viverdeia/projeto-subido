import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import { CatalogoProjetos } from './CatalogoProjetos';

describe('catálogo de projetos', () => {
  it('não promete projetos inexistentes e oferece uma continuação útil', () => {
    render(<CatalogoProjetos solucoes={[]} />);

    expect(
      screen.getByRole('heading', {
        name: 'Os projetos guiados ainda não foram publicados.',
      }),
    ).toBeDefined();
    expect(screen.queryByText('Cinco projetos.')).toBeNull();
    expect(screen.getByRole('link', { name: /Ver formações/ }).getAttribute('href')).toBe(
      '/formacoes',
    );
  });

  it('orienta qual projeto é a melhor porta de entrada', () => {
    const ids = ['entender', 'preparar', 'construir', 'validar', 'entregar'] as const;
    const solucao: SolucaoResumo = {
      id: 's1',
      slug: 'radar-satisfacao-com-ia',
      titulo: 'Radar de Satisfação com IA',
      resumo: 'Pesquisa curta com alerta de recuperação.',
      categoria: 'Experiência do cliente',
      publicado_em: '2026-08-12T00:00:00.000Z',
      criado_em: '2026-08-12T00:00:00.000Z',
      etapaIds: ids.map((id) => `projeto:radar-satisfacao-com-ia:${id}:passo-${id}`),
      ferramentas: ['Supabase'],
      projeto: {
        resultado: 'Pesquisa curta com alerta e relatório semanal.',
        clienteIdeal: 'Empresa com clientes recorrentes.',
        entregavelFinal: 'Radar validado e manual de operação.',
        versao: 1,
        roteiro: {
          perfil: {
            nivel: 'entrada',
            prazo: '5 a 10 dias úteis',
            formatoPiloto: 'Um momento, um canal e uma equipe responsável.',
            primeiraProva: 'Trinta respostas com tema, evidência e alerta rastreável.',
            recomendadoParaComecar: true,
          },
          fundamentos: [],
          fases: ids.map((id) => ({
            id,
            titulo: id,
            objetivo: `Objetivo suficientemente detalhado para a fase ${id}.`,
            passos: [
              {
                id: `passo-${id}`,
                titulo: `Executar ${id}`,
                acao: `Execute uma ação verificável e suficientemente detalhada na fase ${id}.`,
                concluidoQuando: 'Existe uma evidência objetiva aprovada pelo responsável.',
                entregavel: `Entrega da fase ${id}`,
                insumos: [],
                execucao: [],
              },
            ],
          })),
        },
      },
    };

    render(<CatalogoProjetos solucoes={[solucao]} />);

    expect(screen.getByRole('heading', { name: 'Projetos' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Comece por aqui' })).toBeDefined();
    expect(screen.getByText('5 a 10 dias úteis')).toBeDefined();
    expect(screen.getByText('Para começar')).toBeDefined();
    expect(screen.getByRole('link', { name: /Ver projeto/ })).toBeDefined();
  });
});

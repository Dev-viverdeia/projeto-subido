import Link from 'next/link';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { montarPlanoJornada } from '@/lib/jornada/motor';
import { MapaJornada } from './MapaJornada';

function planoVazio() {
  return montarPlanoJornada({
    perfil: null,
    aprendizado: {
      aulasConcluidas: 0,
      formacoesConcluidas: 0,
      etapasConcluidas: 0,
      projetosConcluidos: 0,
    },
    oportunidades: { total: 0, enriquecidas: 0, comProximaAcao: 0, ganhas: 0 },
    calls: { descobertasConcluidas: 0, kickoffsConcluidos: 0, entregasConcluidas: 0 },
    propostas: { total: 0, apresentadas: 0, aceitas: 0 },
    entregas: {
      projetosIniciados: 0,
      projetosConcluidos: 0,
      propostaAceitaEmFocoId: null,
      projetoEmFocoId: null,
      projetoEmFocoTitulo: null,
      tarefasConcluidas: 0,
      tarefasTotal: 0,
    },
  });
}

describe('MapaJornada', () => {
  it('mantém somente uma direção principal e o contexto mínimo', () => {
    render(
      <MapaJornada
        nome="Rafael"
        plano={planoVazio()}
        prioridade={
          <article>
            <h1>Concluir a primeira formação</h1>
            <Link href="/formacoes">Ver formações</Link>
          </article>
        }
        proximaMentoria="Mentoria de implementação"
      />,
    );

    expect(screen.getByText(/Rafael\.$/)).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Concluir a primeira formação',
    );
    expect(screen.getByRole('progressbar', { name: 'Progresso do trabalho' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    expect(screen.getByRole('link', { name: /Ver agenda/ })).toHaveAttribute('href', '/mentorias');
    expect(screen.queryByText('Operação comercial')).not.toBeInTheDocument();
  });
});

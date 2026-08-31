import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ContinuidadePosEntregaDossie } from '@/lib/crm/queries';
import { ContextoPosEntrega } from './ContextoPosEntrega';

const CONTINUIDADE: ContinuidadePosEntregaDossie = {
  projetoId: '66666666-6666-4666-8666-666666666666',
  projetoTitulo: 'SDR de Atendimento da Clínica Aurora',
  resumoEntrega: 'SDR implantado e validado pelo cliente.',
  resultadoPrincipal: 'Tempo de resposta reduzido.',
  resultadoObservado: 'O tempo médio de resposta caiu de 18 para 4 minutos.',
  evidenciaResultadoUrl: 'https://example.com/resultado',
  decisao: 'expandir',
  proximoPasso: 'Validar a expansão para os canais de Instagram e site.',
  proximoPassoEm: '2026-09-09',
  aceitaEm: '2026-08-01T12:00:00.000Z',
  registradaEm: '2026-08-31T13:00:00.000Z',
};

describe('ContextoPosEntrega', () => {
  it('apresenta o resultado confirmado, a decisão e a abordagem da expansão', () => {
    render(<ContextoPosEntrega continuidade={CONTINUIDADE} />);

    expect(screen.getByRole('heading', { name: 'Este cliente já confirmou valor.' })).toBeVisible();
    expect(screen.getByText(CONTINUIDADE.resultadoObservado)).toBeVisible();
    expect(screen.getByText('Expandir este projeto')).toBeVisible();
    expect(screen.getByText(CONTINUIDADE.proximoPasso)).toBeVisible();
    expect(screen.getByRole('link', { name: /Abrir resultado/ })).toHaveAttribute(
      'href',
      CONTINUIDADE.evidenciaResultadoUrl,
    );
    expect(screen.getByRole('link', { name: /Revisar entrega/ })).toHaveAttribute(
      'href',
      `/entregas/${CONTINUIDADE.projetoId}`,
    );
  });

  it('muda a orientação quando a revisão indica outro projeto', () => {
    render(
      <ContextoPosEntrega
        continuidade={{ ...CONTINUIDADE, decisao: 'novo_projeto', evidenciaResultadoUrl: null }}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'O projeto anterior abriu uma nova venda.' }),
    ).toBeVisible();
    expect(screen.getByText('Começar outro projeto')).toBeVisible();
    expect(screen.getByText(/valide o novo problema, o impacto e quem decide/i)).toBeVisible();
    expect(screen.queryByRole('link', { name: /Abrir resultado/ })).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PROPOSTA_PREVIEW } from '@/app/preview/proposta-cliente/fixture';
import { PropostaDocumento } from './PropostaDocumento';

describe('documento público da proposta', () => {
  it('preserva todos os conteúdos, valores e condições do snapshot', () => {
    const { container } = render(
      <PropostaDocumento
        proposta={PROPOSTA_PREVIEW}
        pdfHref="/documento.pdf"
        decisao={<div>Decisão de teste</div>}
      />,
    );
    const d = PROPOSTA_PREVIEW.documento;
    for (const texto of [
      d.projeto.titulo,
      d.projeto.resumo,
      d.desafio,
      d.objetivo,
      ...d.escopo.flatMap((i) => [i.titulo, i.descricao]),
      ...d.entregaveis,
      ...d.cronograma.flatMap((i) => [i.fase, i.duracao, i.descricao]),
      d.investimento.condicoes,
      ...d.proximosPassos,
      d.observacoes!,
    ]) {
      expect(container.textContent).toContain(texto);
    }
    expect(screen.getByText(/18.500,00/)).toBeVisible();
    expect(screen.getByText('15 dias')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Baixar PDF' })).toHaveAttribute(
      'href',
      '/documento.pdf',
    );
    expect(screen.queryByRole('link', { name: 'Abrir pagamento' })).not.toBeInTheDocument();
  });

  it.each(['aceita', 'recusada'] as const)(
    'uma proposta %s não volta a oferecer o formulário',
    (status) => {
      render(
        <PropostaDocumento
          proposta={{
            ...PROPOSTA_PREVIEW,
            status,
            decisaoNome: 'Camila Rios',
            decididaEm: '2026-09-11T18:00:00Z',
            decisaoComentario: 'Rever no próximo trimestre.',
          }}
          pdfHref="/documento.pdf"
          decisao={<div>Decisão de teste</div>}
        />,
      );
      expect(screen.queryByText('Decisão de teste')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: status === 'aceita' ? 'Proposta aprovada' : 'Proposta não aprovada',
        }),
      ).toBeVisible();
      if (status === 'recusada') {
        expect(screen.getByText('Rever no próximo trimestre.')).toBeVisible();
        expect(screen.queryByRole('link', { name: 'Abrir pagamento' })).not.toBeInTheDocument();
      } else {
        expect(screen.getByRole('link', { name: 'Abrir pagamento' })).toHaveAttribute(
          'rel',
          'noopener noreferrer',
        );
      }
    },
  );
});

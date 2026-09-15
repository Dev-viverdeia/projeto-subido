import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { VoltarDaFicha } from './VoltarDaFicha';

const lista = '11111111-1111-4111-8111-111111111111';
const empresa = '22222222-2222-4222-8222-222222222222';

it('volta para a lista mesmo numa ficha existente, sem depender de novo=1', () => {
  render(<VoltarDaFicha parametros={{ origem: 'prospeccao', lista, empresa }} />);
  expect(screen.getByRole('link', { name: 'Voltar para Prospecção' })).toHaveAttribute(
    'href',
    `/prospeccao?lista=${lista}&empresa=${empresa}#empresa-${empresa}`,
  );
  expect(screen.queryByRole('link', { name: 'Voltar para Vendas' })).not.toBeInTheDocument();
});

it.each([
  {},
  { origem: 'prospeccao', lista: '//externo', empresa },
  { origem: 'pos-entrega', lista, empresa },
  { origem: 'prospeccao', lista: [lista], empresa },
])('mantém Vendas como retorno seguro para entrada direta ou inválida', (parametros) => {
  render(<VoltarDaFicha parametros={parametros} />);
  expect(screen.getByRole('link', { name: 'Voltar para Vendas' })).toHaveAttribute(
    'href',
    '/vendas',
  );
});

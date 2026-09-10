import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';
import type { AcaoSobral } from '@/lib/consultor/direcao';
import { ProximaAcaoResposta } from './ProximaAcaoResposta';
vi.mock('./ConfirmarAcaoCrm', () => ({
  ConfirmarAcaoCrm: () => <div>Confirmar tarefa na ficha</div>,
}));
const ID = '11111111-1111-4111-8111-111111111111';
function mensagem(destino: AcaoSobral['destino'], alvo: string | null): MensagemDoConsultor {
  const acao = {
    titulo: 'Executar o próximo passo',
    detalhe: 'Use o que foi confirmado com o cliente.',
    evidencia: 'Resultado revisado com o cliente.',
    destino,
  };
  return {
    id: 'teste',
    papel: 'consultor',
    conteudo: 'Texto de exemplo',
    criadoEm: '2026-09-10T12:00:00Z',
    modelo: null,
    anexos: [],
    cartoes: [],
    acaoConfirmada: null,
    direcao: {
      etapa: 'aprender',
      diagnostico: 'O cliente pediu ajuda com a proposta.',
      foco: 'Criar proposta',
      proximo_passo: acao,
      acoes: [acao],
      gerado_em: '2026-09-10T12:00:00Z',
      contexto_acao: null,
      oportunidade_alvo: alvo,
    },
  };
}
describe('próximo passo contextual', () => {
  it('abre a proposta do cliente diretamente mesmo sem reunião', () => {
    render(
      <ProximaAcaoResposta
        mensagem={mensagem('/propostas/nova', ID)}
        modoPreview={false}
        gerarProximoPasso={false}
      />,
    );
    expect(screen.getByRole('link', { name: 'Criar proposta' })).toHaveAttribute(
      'href',
      `/propostas/nova?oportunidade=${ID}`,
    );
    expect(screen.queryByText('Confirmar tarefa na ficha')).not.toBeInTheDocument();
  });
  it.each([
    ['/formacoes', 'Ver formações'],
    ['/prospeccao', 'Abrir prospecção'],
    ['/entregas', 'Ver entregas'],
    ['/propostas/nova', 'Criar proposta'],
  ] as const)('oferece %s sem puxar um cliente alheio ao pedido', (destino, rotulo) => {
    render(
      <ProximaAcaoResposta
        mensagem={mensagem(destino, null)}
        modoPreview={false}
        gerarProximoPasso={false}
      />,
    );
    expect(screen.getByRole('link', { name: rotulo })).toHaveAttribute('href', destino);
    expect(screen.queryByText('Confirmar tarefa na ficha')).not.toBeInTheDocument();
  });
});

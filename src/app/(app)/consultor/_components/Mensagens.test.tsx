import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';

vi.mock('./ConfirmarAcaoCrm', () => ({
  ConfirmarAcaoCrm: ({ mensagemId }: { mensagemId: string }) => (
    <div>Confirmar ação de {mensagemId}</div>
  ),
}));

import { Mensagens } from './Mensagens';

const base = {
  acaoConfirmada: null,
  anexos: [],
  modelo: null,
  criadoEm: '2026-08-20T12:00:00.000Z',
} satisfies Partial<MensagemDoConsultor>;

function resposta(id: string, tituloDoCartao: string): MensagemDoConsultor {
  return {
    ...base,
    id,
    papel: 'consultor',
    conteudo: `Resposta ${id}`,
    cartoes: [
      {
        tipo: 'projeto',
        chave: id,
        href: '/solucoes/atendimento-com-ia',
        rotulo: 'Atendimento e vendas',
        titulo: tituloDoCartao,
        motivo: 'Este projeto ajuda a executar o próximo passo recomendado.',
      },
    ],
    direcao: {
      etapa: 'vender',
      diagnostico: 'Há uma oportunidade aberta que precisa de uma próxima ação clara.',
      foco: 'Conduzir a oportunidade',
      proximo_passo: {
        titulo: `Próximo passo ${id}`,
        detalhe: 'Organize a conversa e registre a próxima ação comercial.',
        evidencia: 'Próxima ação registrada na ficha do cliente.',
        destino: '/vendas',
      },
      acoes: [
        {
          titulo: `Próximo passo ${id}`,
          detalhe: 'Organize a conversa e registre a próxima ação comercial.',
          evidencia: 'Próxima ação registrada na ficha do cliente.',
          destino: '/vendas',
        },
      ],
      gerado_em: '2026-08-20T12:00:00.000Z',
      contexto_acao: {
        oportunidade_id: '00000000-0000-4000-8000-000000000001',
        empresa: 'Clínica Aurora',
        acao_sugerida: `Próximo passo ${id}`,
        acao_atual: null,
        prazo_atual: null,
      },
    },
  };
}

describe('Mensagens compactas do Sobral AI', () => {
  it('mantém o histórico textual e detalha somente a resposta mais recente', () => {
    render(
      <Mensagens
        compacto
        mensagens={[
          resposta('antiga', 'Projeto antigo'),
          {
            ...base,
            id: 'pergunta',
            papel: 'usuario',
            conteudo: 'O que faço agora?',
            cartoes: [],
            direcao: null,
          },
          resposta('recente', 'Projeto recomendado agora'),
        ]}
      />,
    );

    expect(screen.getByText('Resposta antiga')).toBeVisible();
    expect(screen.getByText('O que faço agora?')).toBeVisible();
    expect(screen.getByText('Resposta recente')).toBeVisible();
    expect(screen.getAllByText('Sobral AI')).toHaveLength(2);
    expect(screen.queryByText('Projeto antigo')).not.toBeInTheDocument();
    expect(screen.getByText('Projeto recomendado agora')).toBeVisible();
    expect(screen.queryByText('Confirmar ação de antiga')).not.toBeInTheDocument();
    expect(screen.getByText('Confirmar ação de recente')).toBeVisible();
    expect(screen.queryByText('Próximo passo recente')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar a resposta do Sobral AI' })).toBeVisible();
  });

  it('mostra o áudio como player e remove a copy técnica do anexo', () => {
    render(
      <Mensagens
        modoPreview
        mensagens={[
          {
            ...base,
            id: 'audio',
            papel: 'usuario',
            conteudo: 'Áudio enviado.',
            anexos: [
              {
                id: '77777777-7777-4777-8777-777777777777',
                nome: 'Audio Sobral AI 12-00.webm',
                tipoMime: 'audio/webm',
                tamanhoBytes: 12000,
                categoria: 'audio',
              },
            ],
            cartoes: [],
            direcao: null,
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Reproduzir áudio' })).toBeVisible();
    expect(screen.getByText('Mensagem de áudio')).toBeVisible();
    expect(screen.queryByText('Áudio enviado.')).not.toBeInTheDocument();
    expect(screen.queryByText('Audio Sobral AI 12-00.webm')).not.toBeInTheDocument();
  });
});

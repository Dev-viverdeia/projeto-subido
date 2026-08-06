import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import { EtapaCriacao } from './EtapaCriacao';

/**
 * A ETAPA CRIAÇÃO É A ADAPTAÇÃO HONESTA DOS "TRÊS ESPECIALISTAS" DO PRINT.
 *
 * Lá são três agentes com chamadas próprias e tempo medido ("✓ 30s", "6s"); aqui
 * é UMA geração em tarefa de fundo, e a página só conhece o status. Os cards
 * mostram AS TRÊS PARTES DO DOCUMENTO — que existem de verdade e são escritas
 * nessa ordem — em vez de nomear trabalhadores que o sistema não tem.
 *
 * Duas coisas precisam continuar verdadeiras, e são o que este teste prende:
 *
 * 1. NENHUM CARD EXIBE TEMPO. Segundo inventado é medição falsa, e é a diferença
 *    entre narrar uma espera e mentir sobre ela.
 * 2. A ÚLTIMA PARTE NUNCA COMPLETA SOZINHA. Sem essa trava a narração marcaria as
 *    três como prontas em ~90s e ficaria exibindo "tudo pronto" com a geração
 *    ainda rodando.
 */
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/builder/actions', () => ({ voltarParaEntrevista: vi.fn() }));

const DOC = {
  ferramentas: [
    { nome: 'n8n', papel: 'p' },
    { nome: 'WhatsApp', papel: 'p' },
  ],
  etapas: [
    { titulo: 'A', descricao: 'd', ferramentas: [] },
    { titulo: 'B', descricao: 'd', ferramentas: [] },
  ],
  prompts: [{ titulo: 'P', conteudo: 'c' }],
  riscos: [{ risco: 'r', mitigacao: 'm' }],
} as unknown as DocumentoSolucao;

function avancarCiclos(quantos: number, intervalo: number) {
  for (let i = 0; i < quantos; i += 1) {
    act(() => {
      vi.advanceTimersByTime(intervalo);
    });
  }
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('etapa de criação', () => {
  it('gerando: a primeira parte escreve, as outras esperam', () => {
    render(<EtapaCriacao id="p1" documento={null} />);

    expect(screen.getByText('Arquitetura').closest('li')).toHaveProperty(
      'dataset.estado',
      'fazendo',
    );
    expect(screen.getByText('Prompts e riscos').closest('li')).toHaveProperty(
      'dataset.estado',
      'espera',
    );
  });

  /* O CORAÇÃO: por mais que o tempo passe, a última não vira "pronta" sem o
     documento chegar. */
  it('a última parte não completa enquanto a geração não termina', () => {
    render(<EtapaCriacao id="p1" documento={null} />);
    avancarCiclos(30, 45_000);

    const ultima = screen.getByText('Prompts e riscos').closest('li') as HTMLElement;
    expect(ultima.dataset.estado).toBe('fazendo');
    /* As DUAS primeiras ficam prontas — elas realmente ficaram para trás. A
       afirmação é sobre a última, e a primeira versão deste teste exigia zero
       "pronta", o que reprovava o comportamento certo. */
    expect(screen.getAllByText('pronta')).toHaveLength(2);
  });

  it('nenhum card exibe tempo', () => {
    render(<EtapaCriacao id="p1" documento={null} />);
    avancarCiclos(30, 45_000);
    expect(screen.queryByText(/\d+\s*s\b/)).toBeNull();
  });

  /* Com o documento na mão, cada parte diz o que PRODUZIU — número real vindo do
     documento, não de contagem inventada. */
  it('pronto: as três ficam prontas e mostram o que saiu', () => {
    render(<EtapaCriacao id="p1" documento={DOC} />);

    expect(screen.getAllByText('pronta')).toHaveLength(3);
    expect(screen.getByText('2 ferramentas no caminho')).toBeDefined();
    expect(screen.getByText('2 etapas')).toBeDefined();
    expect(screen.getByText('1 prompts · 1 riscos mapeados')).toBeDefined();
  });

  it('depois de ~4 minutos sem resposta, oferece saída em vez de girar em silêncio', () => {
    render(<EtapaCriacao id="p1" documento={null} />);
    avancarCiclos(41, 6000);

    expect(screen.getByText(/tempo demais/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Voltar à entrevista/ })).toBeDefined();
    expect(screen.queryByText('Arquitetura')).toBeNull();
  });
});

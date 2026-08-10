import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DadosRoteiroProjeto, ItemSolucao } from '@/lib/conteudo/queries';
import type { ProjetoGuiado } from './ProjetoGuiado';

const fases = ['entender', 'preparar', 'construir', 'validar', 'entregar'] as const;

const projeto: DadosRoteiroProjeto = {
  resultado: 'Uma operação completa e validada nas mãos do cliente.',
  clienteIdeal: 'Uma empresa com processo recorrente e um responsável disponível para validar.',
  entregavelFinal: 'Operação ativa, testes, treinamento e manual de acompanhamento.',
  versao: 1,
  roteiro: {
    fases: fases.map((id, indice) => ({
      id,
      titulo: id[0]!.toUpperCase() + id.slice(1),
      objetivo: `Objetivo detalhado e verificável da fase de ${id}.`,
      passos: [
        {
          id: `passo-${id}`,
          titulo: indice === 0 ? 'Mapear o cenário atual' : `Executar ${id}`,
          acao: `Execute uma ação suficientemente detalhada na fase ${id}.`,
          concluidoQuando: 'A evidência foi registrada e revisada pelo responsável.',
          entregavel: `Entrega da fase ${id}`,
        },
      ],
    })),
  },
};

function item(id: string, tipo: 'ferramenta' | 'prompt'): ItemSolucao {
  return {
    id,
    solucao_id: 's1',
    tipo,
    ordem: 1,
    titulo: tipo === 'ferramenta' ? 'Supabase' : 'Revisar implantação',
    conteudo: 'Conteúdo pronto para usar na implantação.',
  };
}

type Props = Parameters<typeof ProjetoGuiado>[0];
let Tela: (props: Props) => React.ReactNode;

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  Reflect.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
  });
  Tela = (await import('./ProjetoGuiado')).ProjetoGuiado;
});

function montar() {
  return render(
    <Tela
      slug="crm-comercial"
      titulo="CRM Comercial com IA"
      resumo="Um CRM factual para conduzir a venda."
      categoria="Vendas"
      projeto={projeto}
      ferramentas={[item('f1', 'ferramenta')]}
      prompts={[item('p1', 'prompt')]}
      videoUrl={null}
      proxima={null}
    />,
  );
}

describe('Projeto guiado', () => {
  it('mostra uma fase por vez e permite navegar pelas cinco etapas', async () => {
    const user = userEvent.setup();
    montar();

    const navegacao = screen.getByRole('navigation', { name: 'Fases do projeto' });
    expect(within(navegacao).getAllByRole('button')).toHaveLength(5);
    expect(screen.getByRole('heading', { level: 2, name: 'Entender' })).toBeDefined();
    expect(screen.queryByRole('heading', { level: 2, name: 'Preparar' })).toBeNull();
    expect(screen.getByText(projeto.entregavelFinal)).toBeDefined();
    expect(screen.getAllByText('Próximo passo').length).toBeGreaterThan(0);
    expect(screen.getByRole('progressbar', { name: 'Progresso do projeto' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );

    await user.click(within(navegacao).getByRole('button', { name: /Preparar/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Preparar' })).toBeDefined();
    expect(screen.queryByRole('heading', { level: 2, name: 'Entender' })).toBeNull();

    await user.click(within(navegacao).getByRole('button', { name: /Entregar/ }));
    expect(screen.getByRole('link', { name: /Abrir kit de implementação/ })).toHaveAttribute(
      'href',
      '#kit-projeto',
    );
  });

  it('marca o passo e move a retomada para o seguinte', async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole('button', { name: 'Concluir: Mapear o cenário atual' }));
    expect(screen.getByText('1 de 5 passos')).toBeDefined();
    expect(screen.getByRole('heading', { level: 2, name: 'Preparar' })).toBeDefined();
  });

  it('leva a identidade do projeto ao Estúdio', () => {
    montar();
    expect(screen.getByRole('link', { name: /Personalizar no Estúdio/ })).toHaveAttribute(
      'href',
      '/builder?projeto=crm-comercial',
    );
  });
});

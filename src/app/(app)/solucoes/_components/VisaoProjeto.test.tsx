import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  projetoPreview,
  rotaPreview,
  ferramentasPreview,
  promptsPreview,
} from '@/app/preview/projetos/fixture';
import { obterVisaoVisual } from '@/lib/projetos/visao-visual';
import { VisaoProjeto } from './VisaoProjeto';
import { FluxoProjeto } from './FluxoProjeto';
import { KitProjeto, type AreaKitProjeto } from './KitProjeto';

function KitEmUso() {
  const [area, setArea] = useState<AreaKitProjeto>('preparar');
  return (
    <KitProjeto
      slug="sdr-atendimento-qualificacao"
      titulo="Atendimento no WhatsApp com IA"
      projeto={projetoPreview}
      ferramentas={ferramentasPreview}
      prompts={promptsPreview}
      rotaComercial={rotaPreview}
      area={area}
      aoMudarArea={setArea}
      direto
    />
  );
}

describe('Visão visual dos projetos', () => {
  it.each([
    'sdr-atendimento-qualificacao',
    'maquina-prospeccao-b2b',
    'inteligencia-comercial-com-ia',
    'operacao-conteudo-multicanal',
    'radar-satisfacao-com-ia',
  ])('explica entrada, IA e entrega do projeto %s', (slug) => {
    const visao = obterVisaoVisual(slug)!;
    render(<FluxoProjeto visao={visao} compacto />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    Object.values(visao).forEach((movimento) =>
      expect(screen.getByText(movimento.titulo)).toBeVisible(),
    );
  });

  it('troca o exemplo por teclado, sem executar o projeto nem simular conclusão', async () => {
    const user = userEvent.setup();
    const visao = obterVisaoVisual('sdr-atendimento-qualificacao')!;
    render(<FluxoProjeto visao={visao} />);
    const botao = screen.getByRole('button', { name: /IA atende e qualifica/ });
    botao.focus();
    await user.keyboard('{Enter}');
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(visao.processamento.descricao)).toBeVisible();
    expect(screen.queryByText(visao.entrada.descricao)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('mantém cliente ideal e entrega acessíveis sob consulta', async () => {
    const user = userEvent.setup();
    render(
      <VisaoProjeto
        slug="sdr-atendimento-qualificacao"
        titulo="Atendimento no WhatsApp com IA"
        projeto={projetoPreview}
        videoUrl={null}
      />,
    );
    expect(screen.getByText(projetoPreview.clienteIdeal)).not.toBeVisible();
    await user.click(screen.getByText('Para qual cliente'));
    expect(screen.getByText(projetoPreview.clienteIdeal)).toBeVisible();
    await user.click(screen.getByText('O que você entrega'));
    expect(screen.getByText(projetoPreview.entregavelFinal)).toBeVisible();
  });

  it('usa conteúdo real como fallback para projetos novos ou sem vídeo', () => {
    expect(obterVisaoVisual('constructor')).toBeNull();
    render(
      <VisaoProjeto
        slug="projeto-novo"
        titulo="Projeto novo"
        projeto={{
          ...projetoPreview,
          roteiro: { ...projetoPreview.roteiro, trilhaDidatica: undefined },
        }}
        videoUrl={null}
      />,
    );
    expect(screen.getByRole('heading', { name: 'O que você vai construir' })).toBeVisible();
    expect(screen.getByText(projetoPreview.resultado)).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Como funciona' })).toBeNull();
  });

  it('mostra requisitos primeiro, guarda os modelos completos e recolhe prompts longos', async () => {
    const user = userEvent.setup();
    render(<KitEmUso />);
    const requisitos = screen.getByRole('list', { name: 'Pré-requisitos do projeto' });
    projetoPreview.roteiro.escopo!.preRequisitos.forEach((item) =>
      expect(within(requisitos).getByText(item)).toBeVisible(),
    );
    expect(screen.queryByRole('checkbox')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Arquivos e ferramentas' }));
    const material = projetoPreview.roteiro.trilhaDidatica!.materiais[0]!;
    await user.click(screen.getByText(material.titulo));
    expect(screen.getByRole('region', { name: `Modelo: ${material.titulo}` })).toHaveTextContent(
      material.conteudo.replace(/\s+/g, ' '),
    );
    expect(screen.getByRole('button', { name: `Copiar ${material.titulo}` })).toBeVisible();
    expect(
      screen.queryByRole('region', { name: `Texto do prompt: ${promptsPreview[0]!.titulo}` }),
    ).not.toBeVisible();
    await user.click(screen.getByText('Ler prompt'));
    expect(
      screen.getByRole('region', { name: `Texto do prompt: ${promptsPreview[0]!.titulo}` }),
    ).toHaveTextContent(promptsPreview[0]!.conteudo);
  });
});

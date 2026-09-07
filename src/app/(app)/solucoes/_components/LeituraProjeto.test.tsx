import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuiaExecucaoPasso } from './GuiaExecucaoPasso';
import { FichaCampoProjeto } from './EscopoProjeto';
import type { PassoProjeto } from '@/lib/projetos/roteiro';

const passo: PassoProjeto = {
  id: 'mapear',
  titulo: 'Mapear as conversas',
  acao: 'Acompanhe as conversas e confirme o processo com a equipe.',
  insumos: ['Conversas da semana', 'Agenda atual'],
  execucao: ['Exporte as conversas.', 'Separe as exceções.', 'Valide com o responsável.'],
  atencao: 'Remova os dados pessoais desnecessários antes de compartilhar.',
  modelo: { titulo: 'Mapa do processo', conteudo: 'Entrada | responsável | ação | saída' },
  entregavel: 'Mapa aprovado',
  concluidoQuando: 'O responsável confirmou o fluxo e as exceções.',
};

describe('Leitura prática do projeto', () => {
  it('exibe uma ação de cada vez, com limites e acesso à lista inteira', async () => {
    const user = userEvent.setup();
    render(<GuiaExecucaoPasso passo={passo} concluido={false} />);
    const foco = screen.getByRole('region', { name: 'Ação em foco' });
    expect(foco).toHaveTextContent(passo.execucao[0]!);
    expect(screen.getByRole('button', { name: 'Ação anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Ler ação 3' }));
    expect(foco).toHaveTextContent(passo.execucao[2]!);
    expect(screen.queryByRole('button', { name: 'Próxima ação' })).toBeNull();
    await user.click(screen.getByText('Ver todas as ações'));
    expect(screen.getByRole('list').children).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Conferir passo' }));
    expect(screen.getByText(passo.concluidoQuando)).toBeVisible();
    expect(screen.getByText(passo.entregavel)).toBeVisible();
  });

  it('mantém insumos, alerta e modelo completos sem tratar consulta como conclusão', async () => {
    const user = userEvent.setup();
    render(<GuiaExecucaoPasso passo={passo} concluido={false} />);
    await user.click(screen.getByRole('button', { name: 'Separar' }));
    passo.insumos.forEach((item) => expect(screen.getByText(item)).toBeVisible());
    await user.click(screen.getByText('Cuidado neste passo'));
    expect(screen.getByText(passo.atencao!)).toBeVisible();
    await user.click(screen.getByText('Mapa do processo'));
    expect(screen.getByRole('region', { name: 'Modelo: Mapa do processo' })).toHaveTextContent(
      passo.modelo!.conteudo,
    );
    expect(screen.getByRole('button', { name: 'Copiar Mapa do processo' })).toBeVisible();
    expect(screen.queryByText('Passo concluído')).toBeNull();
  });

  it('oferece instrução e conferência mesmo em roteiros antigos sem guia detalhado', async () => {
    const user = userEvent.setup();
    render(
      <GuiaExecucaoPasso
        passo={{ ...passo, execucao: [], insumos: [], modelo: undefined, atencao: undefined }}
        concluido={false}
      />,
    );
    expect(screen.getByRole('region', { name: 'Ação em foco' })).toHaveTextContent(passo.acao);
    await user.click(screen.getByRole('button', { name: 'Separar' }));
    expect(screen.getByText('Este passo não pede materiais adicionais.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Conferir' }));
    expect(screen.getByText(passo.concluidoQuando)).toBeVisible();
  });

  it('revisita passos concluídos pela conferência sem reiniciar a execução', () => {
    render(<GuiaExecucaoPasso passo={passo} concluido />);
    expect(screen.getByRole('button', { name: 'Conferir' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('region', { name: 'Ação em foco' })).toBeNull();
  });

  it('preserva todas as partes do escopo e mantém o primeiro teste visível', async () => {
    const user = userEvent.setup();
    const escopo = {
      inclui: ['Fluxo principal', 'Passagem humana'],
      preRequisitos: ['Canal oficial', 'Responsável'],
      naoInclui: ['Fechamento autônomo'],
      evolucoes: ['Novos canais'],
    };
    render(
      <FichaCampoProjeto
        perfil={{
          nivel: 'avancado',
          prazo: '3 a 5 semanas',
          formatoPiloto: 'Um canal e uma equipe.',
          primeiraProva: 'Vinte conversas reais validadas.',
          recomendadoParaComecar: false,
        }}
        escopo={escopo}
      />,
    );
    for (const [rotulo, itens] of [
      ['O piloto inclui', escopo.inclui],
      ['O cliente precisa ter', escopo.preRequisitos],
      ['Fora do piloto', escopo.naoInclui],
      ['Depois de validar', escopo.evolucoes],
    ] as const) {
      await user.click(screen.getByRole('button', { name: new RegExp(rotulo) }));
      const lista = screen.getByRole('list', { name: rotulo });
      expect(within(lista).getAllByRole('listitem')).toHaveLength(itens.length);
      itens.forEach((item) => expect(within(lista).getByText(item)).toBeVisible());
      expect(screen.getByText('Vinte conversas reais validadas.')).toBeVisible();
    }
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CabineLiveCoach, type SugestaoLive } from './LiveCoach';

const SUGESTAO: SugestaoLive = {
  id: 'sugestao-1',
  categoria: 'impacto',
  titulo: 'Dimensione o custo da espera.',
  sugestao: 'Pergunte o que acontece quando a resposta demora duas horas.',
  metodologia: 'SPIN · implicação',
  trecho_gatilho: 'A resposta demora bastante.',
  prioridade: 3,
};

describe('CabineLiveCoach', () => {
  it('prioriza uma recomendação e explica a memória gerada', () => {
    render(
      <CabineLiveCoach
        ativo
        estado="escutando"
        sugestao={SUGESTAO}
        fala="A equipe só responde quando consegue."
      />,
    );

    expect(screen.getByRole('complementary', { name: 'Live Coach privado' })).toBeInTheDocument();
    expect(screen.getByText('Uma orientação por vez')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: SUGESTAO.titulo })).toBeInTheDocument();
    expect(screen.getByText(/Ouvido agora/)).toHaveTextContent(SUGESTAO.trecho_gatilho!);
    expect(screen.getByText('Só você vê')).toBeInTheDocument();
    expect(screen.getByText(/resumo, decisões e próximo passo no CRM/i)).toBeInTheDocument();
  });
});

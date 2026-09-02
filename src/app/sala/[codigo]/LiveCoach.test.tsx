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
    expect(screen.getByText('Próxima pergunta')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: SUGESTAO.titulo })).toBeInTheDocument();
    expect(screen.getByText(/Baseado no que ouvi/)).toHaveTextContent(SUGESTAO.trecho_gatilho!);
    expect(screen.getByText('Só você vê')).toBeInTheDocument();
    expect(screen.getByText(/resumo e decisões na ficha ao encerrar/i)).toBeInTheDocument();
  });

  it('mostra o objetivo e a primeira pergunta antes da conversa começar', () => {
    render(
      <CabineLiveCoach
        ativo
        estado="escutando"
        sugestao={null}
        fala="Aguardando a primeira fala…"
        plano={{
          origem: 'enriquecimento',
          objetivo: 'Confirmar o impacto da demora no atendimento.',
          abertura: 'Quero entender o processo atual.',
          perguntas: [
            {
              etapa: 'impacto',
              pergunta: 'Quantas oportunidades são perdidas por mês?',
              intencao: 'Dimensionar o impacto.',
              projetoRelacionado: 'SDR de atendimento',
            },
          ],
          fechamento: {
            sinalParaAvancar: 'Impacto confirmado.',
            frase: 'Faz sentido desenhar um piloto?',
            proximoPasso: 'Marcar reunião técnica.',
          },
          fatos: [],
          hipoteses: [],
          projetos: ['SDR de atendimento'],
        }}
      />,
    );

    expect(screen.getByText('Objetivo da conversa')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Confirmar o impacto da demora no atendimento.' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Quantas oportunidades são perdidas por mês/)).toBeInTheDocument();
  });

  it('orienta o kickoff pelos pontos do acordo sem marcar decisões não confirmadas', () => {
    render(
      <CabineLiveCoach
        ativo
        estado="escutando"
        sugestao={SUGESTAO}
        fala="A primeira validação precisa acontecer em duas semanas."
        tipo="kickoff"
      />,
    );

    expect(
      screen.getByRole('complementary', { name: 'Acordo do projeto privado' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Próximo ponto a confirmar')).toBeInTheDocument();
    expect(screen.getByLabelText('Pontos para confirmar no kickoff')).toHaveTextContent(
      'ResultadoResponsáveisAcessosLimites',
    );
    expect(screen.getByText(/acordo pronto para revisão ao encerrar/i)).toBeInTheDocument();
  });
});

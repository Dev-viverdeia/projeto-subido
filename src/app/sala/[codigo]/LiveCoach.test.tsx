import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
  it('não promete transcrição quando áudio e transcrição estão indisponíveis', () => {
    render(
      <CabineLiveCoach
        ativo
        estado="indisponivel"
        sugestao={null}
        fala="Aguardando"
        gravacao="falhou"
        falha="Verifique sua conexão."
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Verifique sua conexão.');
    expect(screen.queryByText('Somente transcrição')).not.toBeInTheDocument();
    expect(screen.getByText('Gravação indisponível')).toBeInTheDocument();
  });
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
    expect(screen.getByRole('heading', { name: SUGESTAO.sugestao })).toBeInTheDocument();
    expect(screen.getByText(SUGESTAO.titulo)).not.toBeVisible();
    fireEvent.click(screen.getByText('Por que perguntar'));
    expect(screen.getByText(SUGESTAO.titulo)).toBeVisible();
    expect(screen.getByText(`“${SUGESTAO.trecho_gatilho}”`)).toBeVisible();
    expect(screen.getByText('Só você vê')).toBeInTheDocument();
    expect(screen.getByText(/resumo na ficha ao encerrar/i)).toBeInTheDocument();
  });

  it('prioriza a primeira pergunta e deixa o objetivo sob demanda', () => {
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
    expect(screen.getByText('Confirmar o impacto da demora no atendimento.')).not.toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Quantas oportunidades são perdidas por mês?' }),
    ).toBeVisible();
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
    expect(screen.getByText(/acordo para revisar ao encerrar/i)).toBeInTheDocument();
  });

  it('permite ocultar a orientação e consultar anteriores sem misturar com a atual', () => {
    const onOcultar = vi.fn();
    render(
      <CabineLiveCoach
        ativo
        estado="escutando"
        sugestao={SUGESTAO}
        fala="Tudo certo."
        onOcultar={onOcultar}
        historico={[
          SUGESTAO,
          { ...SUGESTAO, id: 'anterior', sugestao: 'Qual parte do atendimento mais trava hoje?' },
        ]}
      />,
    );
    expect(screen.getByText('Qual parte do atendimento mais trava hoje?')).not.toBeVisible();
    fireEvent.click(screen.getByText('Orientações anteriores'));
    expect(screen.getByText('Qual parte do atendimento mais trava hoje?')).toBeVisible();
    expect(screen.getAllByText(SUGESTAO.sugestao)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar orientação atual' }));
    expect(onOcultar).toHaveBeenCalledOnce();
  });

  it('não repete uma pergunta de abertura quando a conversa já começou', () => {
    render(
      <CabineLiveCoach
        ativo
        estado="escutando"
        sugestao={null}
        fala="Hoje recebemos quarenta mensagens."
      />,
    );
    expect(screen.getByRole('heading', { name: 'Dê espaço para o cliente.' })).toBeVisible();
    expect(screen.getByText('Hoje recebemos quarenta mensagens.')).not.toBeVisible();
    fireEvent.click(screen.getByText('Última fala'));
    expect(screen.getByText('Hoje recebemos quarenta mensagens.')).toBeVisible();
  });
});

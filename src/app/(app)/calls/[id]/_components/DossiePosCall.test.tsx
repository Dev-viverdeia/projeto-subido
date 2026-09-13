import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PosCall } from '@/lib/calls/queries';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('./FormularioPlanoCall', () => ({
  FormularioPlanoCall: () => <button type="button">Aplicar plano da call</button>,
}));

import { DossiePosCall } from './DossiePosCall';

const POS_CALL: PosCall = {
  operacoes: [],
  reuniao: {
    id: 'call-1',
    titulo: 'Descoberta da Clínica Horizonte',
    tipo: 'descoberta',
    status: 'concluida',
    agendadaPara: '2026-08-08T17:00:00.000Z',
    iniciadaEm: '2026-08-08T17:02:00.000Z',
    encerradaEm: '2026-08-08T17:44:00.000Z',
    duracaoMinutos: 45,
    liveCoachAtivo: true,
    codigoPublico: 'sala-horizonte',
  },
  empresa: { nome: 'Clínica Horizonte', setor: 'Saúde', porte: 'Médio' },
  contato: { nome: 'Marina Alves', cargo: 'Diretora de Operações' },
  oportunidade: {
    id: 'oportunidade-1',
    titulo: 'Automação do atendimento',
    etapa: 'descoberta',
    proximaAcao: null,
    proximaAcaoEm: null,
  },
  analise: {
    status: 'concluida',
    resumo: 'A clínica aceitou avançar com um piloto acompanhado por revisão humana.',
    dores: ['Mensagens ficam sem responsável na troca de turno.'],
    objecoes: ['Respostas clínicas precisam de revisão humana.'],
    decisoes: ['O piloto começará em uma unidade.'],
    compromissos: ['Marina enviará uma amostra anonimizada.'],
    proximosPassos: ['Enviar o diagnóstico do piloto.'],
    oportunidadesProjeto: ['Hipótese: implementar triagem assistida.'],
    lacunas: ['Quem aprova o orçamento final?'],
    sinaisCompra: ['A diretora pediu cronograma e investimento.'],
    briefingOperacional: null,
    sentimento: 'cauteloso',
    notaComercial: 76,
    erro: null,
    atualizadaEm: '2026-08-08T17:46:00.000Z',
  },
  transcricao: null,
  gravacao: null,
  coach: [],
  preparacao: {
    temEnriquecimento: true,
    plano: {
      origem: 'enriquecimento',
      objetivo: 'Confirmar a prioridade da automação do atendimento.',
      abertura: 'Quero entender o processo atual antes de sugerir a solução.',
      perguntas: [],
      fechamento: {
        sinalParaAvancar: 'Dor, impacto e decisor confirmados.',
        frase: 'Faz sentido avançar?',
        proximoPasso: 'Enviar o diagnóstico do piloto.',
      },
      fatos: [],
      hipoteses: [],
      projetos: [],
    },
  },
  sincronizacao: {
    historicoCrm: true,
    acoesPlano: [],
    projetoAtivo: null,
    propostaDaCall: null,
  },
};

describe('DossiePosCall', () => {
  it('reunião concluída sem análise e sem job não fica processando nem afirma ter salvo conteúdo', () => {
    render(<DossiePosCall posCall={{ ...POS_CALL, analise: null }} estadoAcao={null} />);
    expect(
      screen.getByRole('heading', { name: 'Esta reunião ainda não tem resumo.' }),
    ).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar plano da call' })).toBeVisible();
    expect(screen.queryByText('Resumo salvo na ficha do cliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Análise completa')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir ajuda' })).toBeVisible();
  });
  it('falha não oferece hipóteses, resumo parcial ou compromissos antigos como prontos', () => {
    render(
      <DossiePosCall
        posCall={{ ...POS_CALL, analise: { ...POS_CALL.analise!, status: 'falhou' } }}
        estadoAcao={null}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Não foi possível concluir o resumo.' }),
    ).toBeVisible();
    expect(screen.queryByText(POS_CALL.analise!.resumo!)).not.toBeInTheDocument();
    expect(screen.queryByText('Resumo salvo na ficha do cliente')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Criar proposta' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir ficha' })).toBeVisible();
  });
  it('não trata resumo como decisão nem inventa uma conclusão quando não houve acordo', () => {
    render(
      <DossiePosCall
        posCall={{ ...POS_CALL, analise: { ...POS_CALL.analise!, decisoes: [] } }}
        estadoAcao={null}
      />,
    );
    expect(
      screen.getByText(
        'Nenhuma decisão explícita registrada. Defina o próximo passo com o cliente.',
      ),
    ).toBeVisible();
    expect(screen.getByText(POS_CALL.analise!.resumo!)).not.toBeVisible();
    fireEvent.click(screen.getByText('Resumo da conversa'));
    expect(screen.getByText(POS_CALL.analise!.resumo!)).toBeVisible();
  });

  it('preserva todas as decisões, deixando somente as três primeiras abertas', () => {
    const decisoes = ['Uma unidade', 'Revisão humana', 'Validar segurança', 'Conferir integrações'];
    render(
      <DossiePosCall
        posCall={{ ...POS_CALL, analise: { ...POS_CALL.analise!, decisoes } }}
        estadoAcao={null}
      />,
    );
    expect(screen.getAllByText('Uma unidade')[0]).toBeVisible();
    expect(screen.getAllByText('Conferir integrações')[0]).not.toBeVisible();
    fireEvent.click(screen.getByText('Mais 1 decisão'));
    expect(screen.getAllByText('Conferir integrações')[0]).toBeVisible();
  });

  it('prioriza continuar a entrega ao retornar a uma reunião de uma venda ganha', () => {
    render(
      <DossiePosCall
        posCall={{
          ...POS_CALL,
          oportunidade: { ...POS_CALL.oportunidade, etapa: 'ganho' },
          sincronizacao: {
            ...POS_CALL.sincronizacao,
            projetoAtivo: { id: 'entrega-1', titulo: 'Atendimento' },
            propostaDaCall: { id: 'proposta-1', titulo: 'Atendimento', status: 'aceita' },
          },
        }}
        estadoAcao={null}
      />,
    );
    expect(screen.getByRole('link', { name: 'Abrir entrega' })).toHaveAttribute(
      'href',
      '/entregas/entrega-1',
    );
    expect(
      screen.queryByRole('link', { name: 'Revisar e atualizar a venda' }),
    ).not.toBeInTheDocument();
  });
  it('prioriza resumo, revisão humana e só então o detalhamento', () => {
    render(<DossiePosCall posCall={POS_CALL} estadoAcao={null} />);

    expect(screen.getByRole('heading', { name: 'O que ficou decidido' })).toBeInTheDocument();
    expect(screen.getByText('Resumo salvo na ficha do cliente')).toBeVisible();
    expect(screen.getAllByText('O piloto começará em uma unidade.')[0]).toBeVisible();
    expect(screen.getByLabelText('Leitura comercial 76 de 100')).not.toBeVisible();
    expect(screen.getByText('Resumo da conversa').closest('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'Criar proposta' })).toHaveAttribute(
      'href',
      '/propostas/nova?oportunidade=oportunidade-1&reuniao=call-1',
    );
    expect(screen.queryByText('Criar proposta com esta call')).not.toBeInTheDocument();

    const plano = screen.getByRole('heading', { name: 'O que ficou decidido' });
    expect(screen.getByText('Análise completa').closest('details')).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText('Análise completa'));
    const lacunas = screen.getByRole('heading', { name: 'O que ainda falta saber' });
    const mapa = screen.getByRole('heading', { name: 'Informações extraídas da conversa' });

    expect(lacunas).toBeVisible();

    expect(plano.compareDocumentPosition(lacunas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lacunas.compareDocumentPosition(mapa) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('exibe o áudio privado quando a gravação foi concluída', () => {
    const { container } = render(
      <DossiePosCall
        posCall={{
          ...POS_CALL,
          gravacao: {
            status: 'concluida',
            urlTemporaria: 'https://storage.example/call.mp3?token=temporario',
            duracaoSegundos: 2_520,
            tamanhoBytes: 12_000_000,
            mimeType: 'audio/mpeg',
            atualizadaEm: '2026-08-08T17:46:00.000Z',
          },
        }}
        estadoAcao={null}
      />,
    );

    expect(screen.getByText('Transcrição e gravação').closest('details')).not.toHaveAttribute(
      'open',
    );
    fireEvent.click(screen.getByText('Transcrição e gravação'));

    expect(
      screen.getByRole('heading', { name: 'Gravação privada da reunião' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Somente sua conta')).toBeInTheDocument();
    expect(container.querySelector('audio')).toHaveAttribute(
      'src',
      'https://storage.example/call.mp3?token=temporario',
    );
  });

  it('mostra somente o acompanhamento enquanto a análise ainda está sendo preparada', () => {
    render(
      <DossiePosCall
        posCall={{
          ...POS_CALL,
          reuniao: { ...POS_CALL.reuniao, status: 'processando' },
          analise: null,
          operacoes: [
            {
              tipo: 'pos_call',
              status: 'processando',
              tentativas: 1,
              disponivelEm: new Date().toISOString(),
              atualizadaEm: new Date().toISOString(),
              bloqueadoAte: new Date(Date.now() + 60_000).toISOString(),
            },
          ],
        }}
        estadoAcao={null}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Preparando o resumo da conversa.');
    expect(
      screen.queryByRole('heading', { name: 'O que ainda falta saber' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Onde a IA pode ajudar' }),
    ).not.toBeInTheDocument();
  });

  it('transforma o pós-kickoff em revisão do acordo do projeto', () => {
    render(
      <DossiePosCall
        posCall={{
          ...POS_CALL,
          reuniao: { ...POS_CALL.reuniao, tipo: 'kickoff', titulo: 'Kickoff do projeto' },
          oportunidade: { ...POS_CALL.oportunidade, etapa: 'ganho' },
          analise: POS_CALL.analise
            ? {
                ...POS_CALL.analise,
                briefingOperacional: {
                  objetivo: 'Reduzir o tempo de primeira resposta.',
                  criterio_sucesso: 'Responder 80% das mensagens em cinco minutos.',
                  responsavel_cliente: 'Marina Alves',
                  responsavel_tecnico: 'Rafael Milagre',
                  acessos: ['WhatsApp da unidade'],
                  limites: ['Sem orientação clínica automática'],
                  proximos_passos: ['Liberar amostra de conversas'],
                },
              }
            : null,
          sincronizacao: {
            ...POS_CALL.sincronizacao,
            projetoAtivo: { id: 'projeto-1', titulo: 'Atendimento assistido' },
          },
        }}
        estadoAcao={null}
      />,
    );

    expect(screen.getByText(/Acordo do projeto · Leitura pronta/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'O que ficou combinado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revisar acordo do projeto' })).toHaveAttribute(
      'href',
      '/entregas/projeto-1#briefing-kickoff',
    );
  });
});

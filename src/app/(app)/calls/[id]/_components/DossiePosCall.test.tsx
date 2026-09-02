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
  it('prioriza resumo, revisão humana e só então o detalhamento', () => {
    render(<DossiePosCall posCall={POS_CALL} estadoAcao={null} />);

    expect(screen.getByRole('heading', { name: 'O que ficou decidido' })).toBeInTheDocument();
    expect(screen.getByText('Já registrado na ficha')).toBeInTheDocument();
    expect(screen.getByText('Descoberta → Proposta')).toBeInTheDocument();
    expect(screen.getByLabelText('Leitura comercial 76 de 100')).toBeInTheDocument();
    expect(screen.getByText('Você revisa antes de salvar na ficha.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Criar uma proposta a partir desta conversa/ }),
    ).toHaveAttribute('href', '/propostas/nova?oportunidade=oportunidade-1&reuniao=call-1');
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
        }}
        estadoAcao={null}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Salvando a conversa');
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
    expect(
      screen.getByRole('link', { name: /Revisar o briefing em Atendimento assistido/ }),
    ).toHaveAttribute('href', '/entregas/projeto-1#briefing-kickoff');
  });
});

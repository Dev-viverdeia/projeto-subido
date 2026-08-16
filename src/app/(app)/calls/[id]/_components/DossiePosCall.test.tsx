import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PosCall } from '@/lib/calls/queries';

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

    expect(
      screen.getByRole('heading', { name: 'Revise o que muda a partir desta call' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Já registrado no CRM')).toBeInTheDocument();
    expect(screen.getByText('Descoberta → Proposta')).toBeInTheDocument();
    expect(screen.getByLabelText('Leitura comercial 76 de 100')).toBeInTheDocument();
    expect(screen.getByText('Nada muda no pipeline sem sua confirmação.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Transformar esta conversa em uma proposta/ }),
    ).toHaveAttribute('href', '/propostas/nova?oportunidade=oportunidade-1&reuniao=call-1');
    expect(screen.queryByText('Criar proposta com esta call')).not.toBeInTheDocument();

    const leitura = screen.getByRole('heading', {
      name: 'O que ficou claro nesta conversa',
    });
    const plano = screen.getByRole('heading', { name: 'Revise o que muda a partir desta call' });
    const lacunas = screen.getByRole('heading', { name: 'O que ainda falta saber' });
    const mapa = screen.getByRole('heading', { name: 'Rever fatos da conversa' });

    expect(leitura.compareDocumentPosition(plano) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
});

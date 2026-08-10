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
    sentimento: 'cauteloso',
    notaComercial: 76,
    erro: null,
    atualizadaEm: '2026-08-08T17:46:00.000Z',
  },
  transcricao: null,
  coach: [],
  sincronizacao: {
    historicoCrm: true,
    acoesPlano: [],
    projetoAtivo: null,
  },
};

describe('DossiePosCall', () => {
  it('prioriza decisão, lacunas e só então o mapa factual', () => {
    render(<DossiePosCall posCall={POS_CALL} estadoAcao={null} />);

    expect(
      screen.getByRole('heading', { name: 'Transforme a conversa em execução' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Fatos registrados no CRM')).toBeInTheDocument();
    expect(screen.getByText('Descoberta → Proposta')).toBeInTheDocument();
    expect(screen.getByLabelText('Leitura comercial 76 de 100')).toBeInTheDocument();

    const leitura = screen.getByRole('heading', {
      name: 'O que esta conversa realmente mudou',
    });
    const lacunas = screen.getByRole('heading', { name: 'O que ainda falta saber' });
    const mapa = screen.getByRole('heading', { name: 'Mapa factual' });

    expect(
      leitura.compareDocumentPosition(lacunas) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(lacunas.compareDocumentPosition(mapa) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

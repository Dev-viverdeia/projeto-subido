import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { FormacaoResumo, SolucaoResumo } from '@/lib/conteudo/queries';
import type { EstadoProgressoConta } from '@/lib/progresso/local';
import { GaleriaCertificados } from './GaleriaCertificados';

const progressoTeste = vi.hoisted((): { atual: EstadoProgressoConta } => ({
  atual: {
    aulas: {},
    formacoes: {},
    etapas: {},
    solucoes: {},
  },
}));

vi.mock('@/lib/progresso/local', async (importOriginal) => {
  const real = await importOriginal();
  return { ...(real as object), useProgresso: () => progressoTeste.atual };
});

const formacoes: FormacaoResumo[] = [
  {
    id: 'formacao-1',
    slug: 'formacao-de-execucao',
    titulo: 'Formação de execução',
    resumo: 'Aprenda a diagnosticar, construir e validar uma entrega real.',
    capa_url: null,
    publicado_em: '2026-08-01T00:00:00.000Z',
    criado_em: '2026-07-01T00:00:00.000Z',
    modulos: 2,
    aulas: 2,
    aulaIds: ['aula-1', 'aula-2'],
  },
];

const solucoes: SolucaoResumo[] = [
  {
    id: 'projeto-1',
    slug: 'atendimento-com-ia',
    titulo: 'Atendimento com IA',
    resumo: 'Implemente um atendimento conectado ao contexto do cliente.',
    categoria: 'Atendimento',
    publicado_em: '2026-08-01T00:00:00.000Z',
    criado_em: '2026-07-01T00:00:00.000Z',
    etapaIds: ['etapa-1', 'etapa-2'],
    ferramentas: ['OpenAI'],
    projeto: {
      roteiro: {
        trilhaDidatica: { aulas: [{}, {}] },
      },
    } as unknown as SolucaoResumo['projeto'],
  },
];

beforeEach(() => {
  progressoTeste.atual = { aulas: {}, formacoes: {}, etapas: {}, solucoes: {} };
});

describe('galeria de certificados', () => {
  it('transforma o estado vazio em uma escolha concreta de primeiro caminho', () => {
    render(<GaleriaCertificados formacoes={formacoes} solucoes={solucoes} />);

    expect(screen.getByText('Como funciona')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Escolha seu próximo caminho.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Começar formação/ })).toHaveAttribute(
      'href',
      '/formacoes/formacao-de-execucao',
    );
    expect(screen.getByRole('link', { name: /Abrir projeto/ })).toHaveAttribute(
      'href',
      '/solucoes/atendimento-com-ia',
    );
  });

  it('mostra progresso e uma retomada visível quando o caminho já começou', () => {
    progressoTeste.atual = {
      aulas: { 'aula-1': '2026-08-08T10:00:00.000Z' },
      formacoes: { 'formacao-de-execucao': '2026-08-08T10:00:00.000Z' },
      etapas: {},
      solucoes: {},
    };

    render(<GaleriaCertificados formacoes={formacoes} solucoes={solucoes} />);

    const retomada = screen.getByRole('link', { name: /Formação de execução/ });
    expect(within(retomada).getByText('50%')).toBeInTheDocument();
    expect(within(retomada).getByText('Continuar formação')).toBeInTheDocument();
    expect(screen.queryByText('Próximo passo')).not.toBeInTheDocument();
  });

  it('leva a conquista concluída para a folha do certificado', () => {
    progressoTeste.atual = {
      aulas: {
        'aula-1': '2026-08-08T10:00:00.000Z',
        'aula-2': '2026-08-09T10:00:00.000Z',
      },
      formacoes: { 'formacao-de-execucao': '2026-08-08T10:00:00.000Z' },
      etapas: {},
      solucoes: {},
    };

    render(<GaleriaCertificados formacoes={formacoes} solucoes={solucoes} />);

    expect(screen.getByRole('link', { name: 'Ver certificado' })).toHaveAttribute(
      'href',
      '/certificados/formacao/formacao-de-execucao',
    );
    expect(screen.getByText('Formação de execução')).toBeInTheDocument();
  });

  it('não certifica um projeto que concluiu passos sem concluir as aulas', () => {
    progressoTeste.atual = {
      aulas: {},
      formacoes: {},
      etapas: {
        'etapa-1': '2026-08-08T10:00:00.000Z',
        'etapa-2': '2026-08-09T10:00:00.000Z',
      },
      solucoes: { 'atendimento-com-ia': '2026-08-08T10:00:00.000Z' },
    };

    render(<GaleriaCertificados formacoes={formacoes} solucoes={solucoes} />);

    const projeto = screen.getByRole('link', { name: /Atendimento com IA/ });
    expect(within(projeto).getByText('Aulas 0/2')).toBeInTheDocument();
    expect(within(projeto).getByText('Implementação 2/2')).toBeInTheDocument();
    expect(within(projeto).getByText('Concluir aulas')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ver certificado' })).not.toBeInTheDocument();
  });

  it('certifica o projeto depois das aulas e da implementação', () => {
    progressoTeste.atual = {
      aulas: {},
      formacoes: {},
      etapas: {
        'projeto:atendimento-com-ia:aprender:aula-01': '2026-08-08T10:00:00.000Z',
        'projeto:atendimento-com-ia:aprender:aula-02': '2026-08-08T11:00:00.000Z',
        'etapa-1': '2026-08-09T10:00:00.000Z',
        'etapa-2': '2026-08-10T10:00:00.000Z',
      },
      solucoes: { 'atendimento-com-ia': '2026-08-08T10:00:00.000Z' },
    };

    render(<GaleriaCertificados formacoes={formacoes} solucoes={solucoes} />);

    expect(screen.getByRole('link', { name: 'Ver certificado' })).toHaveAttribute(
      'href',
      '/certificados/solucao/atendimento-com-ia',
    );
    expect(screen.getByText('Implementação', { selector: 'dt' })).toBeInTheDocument();
  });
});

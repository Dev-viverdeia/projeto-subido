import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitirCertificado } from '@/lib/certificados/actions';
import type * as ProgressoLocal from '@/lib/progresso/local';
import { CertificadoVista } from './CertificadoVista';

const progressoTeste = vi.hoisted((): { atual: ProgressoLocal.EstadoProgressoConta } => ({
  atual: {
    aulas: {
      'aula-1': '2026-08-20T10:00:00.000Z',
      'aula-2': '2026-08-21T10:00:00.000Z',
    },
    formacoes: { curso: '2026-08-20T10:00:00.000Z' },
    etapas: {},
    solucoes: {},
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/certificados/actions', () => ({
  emitirCertificado: vi.fn(),
}));

vi.mock('@/lib/progresso/local', async (importOriginal) => {
  const original = await importOriginal<typeof ProgressoLocal>();
  return {
    ...original,
    useProgresso: () => progressoTeste.atual,
  };
});

describe('emissão de certificado', () => {
  beforeEach(() => {
    vi.mocked(emitirCertificado).mockReset();
    progressoTeste.atual = {
      aulas: {
        'aula-1': '2026-08-20T10:00:00.000Z',
        'aula-2': '2026-08-21T10:00:00.000Z',
      },
      formacoes: { curso: '2026-08-20T10:00:00.000Z' },
      etapas: {},
      solucoes: {},
    };
  });

  it('mostra o processamento e entrega o compartilhamento sem retirar o usuário da tela', async () => {
    const user = userEvent.setup();
    let concluir!: (resultado: { ok: true; codigo: string }) => void;
    vi.mocked(emitirCertificado).mockImplementationOnce(
      () => new Promise((resolve) => (concluir = resolve)),
    );

    render(
      <CertificadoVista
        origem="formacao"
        slug="curso"
        titulo="Formação prática"
        aprendizadoIds={['aula-1', 'aula-2']}
        implementacaoIds={[]}
        hrefConteudo="/formacoes/curso"
        nome="Pessoa Teste"
        codigoInicial={null}
        siteUrl="https://projeto-subido.vercel.app"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar link público' }));

    expect(
      await screen.findByRole('dialog', { name: 'Preparando seu certificado' }),
    ).toHaveTextContent('Validando sua conclusão');

    await act(async () => {
      concluir({ ok: true, codigo: 'certificado-publico' });
      await Promise.resolve();
    });

    const sucesso = await screen.findByRole('dialog', {
      name: 'Certificado pronto para compartilhar',
    });
    expect(sucesso).toHaveTextContent('Link público criado');
    expect(screen.getAllByRole('link', { name: 'Compartilhar no LinkedIn' })[0]).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('/certificado/certificado-publico')),
    );
  });

  it('explica o que falta quando as aulas terminaram mas a implementação não', () => {
    progressoTeste.atual = {
      aulas: {},
      formacoes: {},
      etapas: {
        'aula-projeto-1': '2026-08-20T10:00:00.000Z',
        'aula-projeto-2': '2026-08-20T11:00:00.000Z',
        'passo-1': '2026-08-21T10:00:00.000Z',
      },
      solucoes: { projeto: '2026-08-20T10:00:00.000Z' },
    };

    render(
      <CertificadoVista
        origem="solucao"
        slug="projeto"
        titulo="Atendimento com IA"
        aprendizadoIds={['aula-projeto-1', 'aula-projeto-2']}
        implementacaoIds={['passo-1', 'passo-2']}
        hrefConteudo="/solucoes/projeto"
        nome="Pessoa Teste"
        codigoInicial={null}
        siteUrl="https://projeto-subido.vercel.app"
      />,
    );

    expect(screen.getByText('2/2 aulas concluídas')).toBeInTheDocument();
    expect(screen.getByText('1/2 passos concluídos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continuar implementação' })).toHaveAttribute(
      'href',
      '/solucoes/projeto',
    );
    expect(screen.queryByRole('button', { name: 'Salvar em PDF' })).not.toBeInTheDocument();
  });

  it('descreve no certificado de projeto as duas partes concluídas', () => {
    progressoTeste.atual = {
      aulas: {},
      formacoes: {},
      etapas: {
        'aula-projeto': '2026-08-20T10:00:00.000Z',
        'passo-projeto': '2026-08-21T10:00:00.000Z',
      },
      solucoes: { projeto: '2026-08-20T10:00:00.000Z' },
    };

    render(
      <CertificadoVista
        origem="solucao"
        slug="projeto"
        titulo="Atendimento com IA"
        aprendizadoIds={['aula-projeto']}
        implementacaoIds={['passo-projeto']}
        hrefConteudo="/solucoes/projeto"
        nome="Pessoa Teste"
        codigoInicial={null}
        siteUrl="https://projeto-subido.vercel.app"
      />,
    );

    expect(
      screen.getByText(
        (_conteudo, elemento) =>
          elemento?.tagName === 'P' &&
          elemento.textContent === 'concluiu o aprendizado e a implementação guiada do projeto',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Aulas').parentElement).toHaveTextContent('1/1');
    expect(screen.getByText('Implementação').parentElement).toHaveTextContent('1/1');
  });
});

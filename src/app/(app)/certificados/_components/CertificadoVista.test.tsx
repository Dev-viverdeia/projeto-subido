import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('a folha e o compartilhamento preservam o registro emitido se a conta ou o catálogo mudar', async () => {
    const user = userEvent.setup();
    render(
      <CertificadoVista
        origem="formacao"
        slug="curso"
        titulo="Título atual do catálogo"
        aprendizadoIds={['aula-1', 'aula-2']}
        implementacaoIds={[]}
        hrefConteudo="/formacoes/curso"
        nome="Nome atual da conta"
        codigoInicial="registro-123"
        siteUrl="https://subido.viverdeia.ai"
        registroInicial={{
          nome: 'Nome na emissão',
          titulo: 'Título certificado',
          concluidoEm: '2026-08-21T10:00:00Z',
          emitidoEm: '2026-09-08T12:00:00Z',
        }}
      />,
    );
    expect(screen.getByText('Nome na emissão')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Título certificado');
    await user.click(screen.getByRole('button', { name: 'Compartilhar no LinkedIn' }));
    await user.click(screen.getByRole('button', { name: 'Perfil' }));
    expect(screen.getByText('setembro de 2026')).toBeInTheDocument();
    expect(screen.queryByText('Nome atual da conta')).not.toBeInTheDocument();
    expect(emitirCertificado).not.toHaveBeenCalled();
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

    expect(emitirCertificado).not.toHaveBeenCalled();
    const gatilho = screen.getByRole('button', { name: 'Compartilhar no LinkedIn' });
    await user.click(gatilho);
    fireEvent.click(gatilho);
    expect(emitirCertificado).toHaveBeenCalledOnce();

    expect(
      await screen.findByRole('dialog', { name: 'Preparando para compartilhar' }),
    ).toHaveTextContent('Validando sua conclusão');

    await act(async () => {
      concluir({ ok: true, codigo: 'certificado-publico' });
      await Promise.resolve();
    });

    const sucesso = await screen.findByRole('dialog', {
      name: 'Compartilhar certificado',
    });
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(sucesso).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('link', { name: 'Publicar no LinkedIn' })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('/certificado/certificado-publico')),
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(gatilho).toHaveFocus());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('recupera falhas de rede sem prender o loading e permite uma nova tentativa', async () => {
    vi.mocked(emitirCertificado)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce({ ok: true, codigo: 'certificado-recuperado' });
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
        siteUrl="https://subido.viverdeia.ai"
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Compartilhar no LinkedIn' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Não foi possível preparar o certificado. Tente novamente.',
    );
    expect(screen.queryByText('Validando sua conclusão…')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      await screen.findByRole('dialog', { name: 'Compartilhar certificado' }),
    ).toBeInTheDocument();
    expect(emitirCertificado).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('link', { name: 'Publicar no LinkedIn' })).toHaveAttribute(
      'href',
      expect.stringContaining('certificado-recuperado'),
    );
  });

  it('respeita a recusa do servidor e permite fechar o erro pelo teclado', async () => {
    vi.mocked(emitirCertificado).mockResolvedValueOnce({
      ok: false,
      mensagem: 'Conclua todas as aulas para emitir o certificado.',
    });
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
        siteUrl="https://subido.viverdeia.ai"
      />,
    );
    const user = userEvent.setup();
    const gatilho = screen.getByRole('button', { name: 'Compartilhar no LinkedIn' });
    await user.click(gatilho);
    expect(await screen.findByRole('dialog')).toHaveTextContent('Conclua todas as aulas');
    expect(screen.queryByRole('link', { name: 'Publicar no LinkedIn' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(gatilho).toHaveFocus());
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
          elemento.textContent ===
            'Pela conclusão do aprendizado e da implementação guiada do projeto',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Aulas').parentElement).toHaveTextContent('1/1');
    expect(screen.getByText('Implementação').parentElement).toHaveTextContent('1/1');
  });
});

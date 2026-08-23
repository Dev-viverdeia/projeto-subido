import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emitirCertificado } from '@/lib/certificados/actions';
import type * as ProgressoLocal from '@/lib/progresso/local';
import { CertificadoVista } from './CertificadoVista';

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
    useProgresso: () => ({
      aulas: {
        'aula-1': '2026-08-20T10:00:00.000Z',
        'aula-2': '2026-08-21T10:00:00.000Z',
      },
      formacoes: { curso: '2026-08-20T10:00:00.000Z' },
      etapas: {},
      solucoes: {},
    }),
  };
});

describe('emissão de certificado', () => {
  beforeEach(() => {
    vi.mocked(emitirCertificado).mockReset();
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
        itemIds={['aula-1', 'aula-2']}
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
});

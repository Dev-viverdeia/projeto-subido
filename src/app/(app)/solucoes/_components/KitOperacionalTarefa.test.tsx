import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KitOperacionalTarefa } from './KitOperacionalTarefa';

const KIT = {
  projetoSlug: 'sdr-atendimento-qualificacao',
  duracao: '45 min',
  insumos: ['Perguntas aprovadas pelo cliente'],
  checklist: ['Organize as respostas por assunto', 'Registre a fonte de cada resposta'],
  cuidado: 'Não publique respostas sem a aprovação do responsável.',
  modelo: {
    titulo: 'Base de resposta',
    conteudo: 'Pergunta:\nResposta aprovada:\nFonte:\nRevisado em:',
  },
};

describe('KitOperacionalTarefa', () => {
  it('mostra o roteiro da tarefa e permite consultar o modelo', async () => {
    const user = userEvent.setup();
    render(<KitOperacionalTarefa kit={KIT} arquivosDaTarefa={0} onAbrirArquivos={vi.fn()} />);

    expect(screen.queryByText('Perguntas aprovadas pelo cliente')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Abrir guia' }));
    expect(screen.getByText('Perguntas aprovadas pelo cliente')).toBeVisible();
    expect(screen.getByText('Registre a fonte de cada resposta')).toBeVisible();
    expect(screen.getByRole('link', { name: /Rever minicurso/i })).toHaveAttribute(
      'href',
      '/solucoes/sdr-atendimento-qualificacao',
    );

    await user.click(screen.getByRole('tab', { name: 'Modelo pronto' }));
    expect(screen.getByRole('region', { name: 'Modelo: Base de resposta' })).toBeVisible();
  });

  it('abre o cofre pela ação ligada à tarefa', async () => {
    const user = userEvent.setup();
    const abrirArquivos = vi.fn();
    render(<KitOperacionalTarefa kit={KIT} arquivosDaTarefa={0} onAbrirArquivos={abrirArquivos} />);

    await user.click(screen.getByRole('button', { name: 'Abrir guia' }));
    await user.click(screen.getByRole('button', { name: 'Adicionar arquivo da tarefa' }));
    expect(abrirArquivos).toHaveBeenCalledOnce();
  });
});

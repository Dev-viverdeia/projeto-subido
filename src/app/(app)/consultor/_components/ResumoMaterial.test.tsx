import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
const { preparar, salvar, refresh } = vi.hoisted(() => ({
  preparar: vi.fn(),
  salvar: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('@/lib/consultor/material-actions', () => ({
  prepararRevisaoMaterial: preparar,
  salvarResumoMaterial: salvar,
}));
import { ResumoMaterial } from './ResumoMaterial';
const id = '11111111-1111-4111-8111-111111111111';
const mensagem = '22222222-2222-4222-8222-222222222222';
const material = {
  resumo: {
    titulo: 'Atendimento com IA',
    escopo: 'Apenas perguntas frequentes.',
    decisoes: '',
    tarefas: 'Ana enviará a FAQ.',
    pendencias: 'Confirmar orçamento.',
  },
  fontes: [{ id, nome: 'reuniao.pdf' }],
  oportunidade: id,
};
beforeEach(() => {
  vi.clearAllMocks();
  preparar.mockResolvedValue({
    fichas: [{ id, nome: 'Clínica exemplo', titulo: 'Atendimento' }],
    salvo: null,
  });
  salvar.mockResolvedValue({
    salvo: { id: mensagem, oportunidade: id, salvoEm: '2026-09-10', titulo: 'Escopo revisado' },
  });
});
async function abrir() {
  render(<ResumoMaterial mensagem={mensagem} material={material} />);
  fireEvent.click(screen.getByRole('button', { name: 'Revisar resumo' }));
  await screen.findByLabelText('Ficha do cliente');
}
it('não grava ao abrir; exige revisão e mantém decisão vazia', async () => {
  await abrir();
  expect(salvar).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Salvar na ficha' })).toBeDisabled();
  expect(screen.getByLabelText('Decisões')).toHaveValue('');
  expect(screen.getByLabelText('Tarefas sugeridas')).toHaveValue('Ana enviará a FAQ.');
});
it('preserva edições ao fechar e exige nova confirmação depois de editar', async () => {
  await abrir();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.change(screen.getByLabelText('Escopo'), { target: { value: 'Só triagem.' } });
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: 'Voltar à conversa' }));
  fireEvent.click(screen.getByRole('button', { name: 'Revisar resumo' }));
  await screen.findByLabelText('Ficha do cliente');
  expect(screen.getByLabelText('Escopo')).toHaveValue('Só triagem.');
});
it('salva o texto revisado na ficha selecionada e mostra link para o registro exato', async () => {
  await abrir();
  fireEvent.change(screen.getByLabelText('Título do registro'), {
    target: { value: 'Escopo revisado' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar na ficha' }));
  await screen.findByText('Resumo registrado.');
  expect(salvar).toHaveBeenCalledExactlyOnceWith({
    ...material.resumo,
    titulo: 'Escopo revisado',
    oportunidade: id,
    mensagem,
    revisado: 'sim',
  });
  expect(screen.getAllByRole('link', { name: 'Ver na ficha' })[0]).toHaveAttribute(
    'href',
    `/vendas/${id}?resumo=${mensagem}#resumo-material`,
  );
  expect(refresh).toHaveBeenCalledOnce();
});
it('erro de gravação não apaga rascunho nem mostra sucesso', async () => {
  salvar.mockRejectedValueOnce(new Error('offline'));
  await abrir();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar na ficha' }));
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Escopo')).toHaveValue(material.resumo.escopo);
  expect(screen.queryByText('Resumo registrado.')).not.toBeInTheDocument();
  // O alerta pode ser renderizado antes de useTransition liberar o formulário.
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Salvar na ficha' })).toBeEnabled(),
  );
});
it('distingue carregamento, erro recuperável e plano sem vendas', async () => {
  preparar.mockRejectedValueOnce(new Error('offline'));
  render(<ResumoMaterial mensagem={mensagem} material={material} />);
  fireEvent.click(screen.getByRole('button', { name: 'Revisar resumo' }));
  await screen.findByRole('button', { name: 'Tentar novamente' });
  preparar.mockResolvedValueOnce({ erro: 'Disponível com Vendas.', plano: true });
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByRole('link', { name: 'Ver meu plano' });
  expect(salvar).not.toHaveBeenCalled();
});
it('um recibo existente impede uma segunda revisão', async () => {
  preparar.mockResolvedValueOnce({
    fichas: [],
    salvo: { id: mensagem, oportunidade: id, salvoEm: '2026-09-10' },
  });
  render(<ResumoMaterial mensagem={mensagem} material={material} />);
  fireEvent.click(screen.getByRole('button', { name: 'Revisar resumo' }));
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Salvar na ficha' })).not.toBeInTheDocument(),
  );
  expect(salvar).not.toHaveBeenCalled();
});

// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { removerCenarioCall } from './smoke-call-sessao.mjs';

const teste = { usuario: 'qa-owner', reuniao: 'qa-call' };
function ambiente(caminho = 'qa-owner/qa-call/audio.mp3') {
  const consulta = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve) =>
      Promise.resolve({ data: [{ caminho_arquivo: caminho }], error: null }).then(resolve),
  };
  const remove = vi.fn().mockResolvedValue({ error: null });
  const deleteUser = vi.fn().mockResolvedValue({ error: null });
  const admin = {
    from: vi.fn(() => consulta),
    storage: { from: vi.fn(() => ({ remove })) },
    auth: { admin: { deleteUser } },
  };
  const erroSe = (erro) => {
    if (erro) throw new Error(erro.message);
  };
  return { admin, remove, deleteUser, consulta, erroSe };
}

describe('limpeza do teste publicado de reunião', () => {
  it('remove apenas o arquivo da conta e reunião criadas no teste', async () => {
    const contexto = ambiente();
    await removerCenarioCall({ ...contexto, teste });
    expect(contexto.consulta.eq).toHaveBeenCalledWith('dono', 'qa-owner');
    expect(contexto.consulta.eq).toHaveBeenCalledWith('reuniao_id', 'qa-call');
    expect(contexto.remove).toHaveBeenCalledWith(['qa-owner/qa-call/audio.mp3']);
    expect(contexto.deleteUser).toHaveBeenCalledWith('qa-owner');
  });

  it('não apaga a conta nem o arquivo quando o caminho pertence a outra reunião', async () => {
    const contexto = ambiente('qa-owner/outra-call/audio.mp3');
    await expect(removerCenarioCall({ ...contexto, teste })).rejects.toThrow('não pertence');
    expect(contexto.remove).not.toHaveBeenCalled();
    expect(contexto.deleteUser).not.toHaveBeenCalled();
  });

  it('preserva a conta para recuperação quando o armazenamento falha', async () => {
    const contexto = ambiente();
    contexto.remove.mockResolvedValue({ error: { message: 'Falha no armazenamento' } });
    await expect(removerCenarioCall({ ...contexto, teste })).rejects.toThrow('armazenamento');
    expect(contexto.deleteUser).not.toHaveBeenCalled();
  });

  it('limpa a conta mesmo se a criação da reunião falhou antes de gerar um ID', async () => {
    const contexto = ambiente();
    await removerCenarioCall({ ...contexto, teste: { usuario: 'qa-owner', reuniao: null } });
    expect(contexto.admin.from).not.toHaveBeenCalled();
    expect(contexto.deleteUser).toHaveBeenCalledWith('qa-owner');
  });
});

import { describe, expect, it } from 'vitest';
import type { ProjetoExecucaoCompleto, TarefaProjetoExecucao } from './queries';
import { montarContextoSobralTarefa } from './contexto-sobral';

describe('montarContextoSobralTarefa', () => {
  it('leva para a conversa apenas o combinado e os materiais da tarefa atual', () => {
    const tarefa = {
      id: 'tarefa-1',
      titulo: 'Montar a base',
      acao: 'Organize as respostas aprovadas.',
      concluidoQuando: 'Dez respostas estão aprovadas.',
      entregavel: 'Base versionada.',
    } as TarefaProjetoExecucao;
    const projeto = {
      titulo: 'Atendimento com IA',
      empresa: 'Clínica Aurora',
      briefing: {
        objetivo: 'Responder rapidamente.',
        criterioSucesso: 'A recepção recebe o contexto completo.',
        acessos: ['WhatsApp Business'],
        limites: ['Dúvidas clínicas seguem para a recepção'],
      },
      documento: { objetivo: 'Organizar o atendimento.' },
      arquivos: [
        { tarefaId: 'tarefa-1', titulo: 'Conversas aprovadas' },
        { tarefaId: 'tarefa-2', titulo: 'Manual final' },
      ],
    } as ProjetoExecucaoCompleto;

    const contexto = montarContextoSobralTarefa(projeto, tarefa);

    expect(contexto).toMatchObject({ empresa: 'Clínica Aurora', tarefa: 'Montar a base' });
    expect(contexto.mensagem).toContain('Organize as respostas aprovadas.');
    expect(contexto.mensagem).toContain('Conversas aprovadas');
    expect(contexto.mensagem).not.toContain('Manual final');
    expect(contexto.mensagem).toContain('sem fazer o trabalho por mim');
  });
});

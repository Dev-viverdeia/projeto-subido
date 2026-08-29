import type { ProjetoExecucaoCompleto, TarefaProjetoExecucao } from './queries';

export type ContextoSobralTarefa = {
  empresa: string;
  tarefa: string;
  mensagem: string;
};

function listar(itens: readonly string[], vazio: string): string {
  return itens.length > 0 ? itens.slice(0, 6).join('; ') : vazio;
}

function frase(rotulo: string, valor: string): string {
  return `${rotulo}: ${valor.trim().replace(/[.!?]+$/, '')}.`;
}

/** Prepara o pedido; a pessoa ainda decide se quer enviá-lo ao Sobral AI. */
export function montarContextoSobralTarefa(
  projeto: ProjetoExecucaoCompleto,
  tarefa: TarefaProjetoExecucao,
): ContextoSobralTarefa {
  const arquivosDaTarefa = projeto.arquivos
    .filter((arquivo) => arquivo.tarefaId === tarefa.id)
    .map((arquivo) => arquivo.titulo);

  return {
    empresa: projeto.empresa,
    tarefa: tarefa.titulo,
    mensagem: [
      `Estou executando a tarefa “${tarefa.titulo}” do projeto “${projeto.titulo}” para ${projeto.empresa}.`,
      frase('Objetivo do cliente', projeto.briefing.objetivo || projeto.documento.objetivo),
      frase('O que preciso fazer', tarefa.acao),
      frase('Está pronto quando', tarefa.concluidoQuando),
      frase('Entregável esperado', tarefa.entregavel),
      frase(
        'Critério de sucesso do projeto',
        projeto.briefing.criterioSucesso || 'ainda não registrado',
      ),
      frase('Acessos combinados', listar(projeto.briefing.acessos, 'nenhum acesso registrado')),
      frase('Limites combinados', listar(projeto.briefing.limites, 'nenhum limite registrado')),
      frase(
        'Materiais ligados a esta tarefa',
        listar(arquivosDaTarefa, 'nenhum arquivo registrado ainda'),
      ),
      'Me ajude a executar esta tarefa sem fazer o trabalho por mim. Organize uma sequência prática, aponte o que devo conferir e termine dizendo qual registro devo deixar na plataforma.',
    ].join('\n'),
  };
}

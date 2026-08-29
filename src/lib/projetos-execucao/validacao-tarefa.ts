import type { StatusTarefaProjeto } from './status';

export type GuiaValidacaoTarefa = {
  criterio: string;
  material: string;
  orientacaoRegistro: string;
  mensagemCliente: string;
};

function semPontoFinal(texto: string): string {
  return texto.trim().replace(/[.!?]+$/, '');
}

export function montarGuiaValidacaoTarefa({
  concluidoQuando,
  entregavel,
}: {
  concluidoQuando: string;
  entregavel: string;
}): GuiaValidacaoTarefa {
  const criterio = concluidoQuando.trim();
  const material = entregavel.trim();

  return {
    criterio,
    material,
    orientacaoRegistro: `Registre o teste realizado, o resultado observado e onde encontrar o material “${semPontoFinal(material)}”.`,
    mensagemCliente: `Concluímos esta etapa.\n\nMaterial entregue: ${material}\n\nPara validar, confira este critério: ${criterio}`,
  };
}

export function validarAtualizacaoTarefa({
  status,
  registro,
  criterioConfirmado,
}: {
  status: StatusTarefaProjeto;
  registro: string;
  criterioConfirmado: boolean;
}): string | null {
  if (status === 'bloqueada' && !registro.trim()) {
    return 'Descreva o bloqueio para saber como retomar.';
  }

  if (status !== 'concluida') return null;
  if (!registro.trim()) return 'Registre como você testou o resultado antes de concluir.';
  if (!criterioConfirmado) return 'Confirme que o resultado atende ao critério desta tarefa.';
  return null;
}

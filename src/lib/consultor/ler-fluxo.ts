import { EventoSobralSchema, type EventoSobral } from './geracao-contrato';

/** Fronteiras de rede não são fronteiras de JSON nem de caracteres UTF-8. */
export async function lerFluxoSobral(response: Response, receber: (evento: EventoSobral) => void) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('fluxo-ausente');
  const decoder = new TextDecoder();
  let buffer = '';
  const linha = (valor: string) => {
    if (!valor.trim()) return false;
    const evento = EventoSobralSchema.parse(JSON.parse(valor));
    receber(evento);
    return evento.tipo === 'estado' && evento.geracao.estado !== 'gerando';
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const partes = buffer.split('\n');
      buffer = partes.pop() ?? '';
      // O recibo já confirma a gravação. A limpeza de arquivos no servidor
      // pode continuar sem manter o campo de mensagem bloqueado.
      for (const parte of partes) if (linha(parte)) return;
      if (buffer.length > 24000) throw new Error('fluxo-invalido');
      if (done) {
        linha(buffer);
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

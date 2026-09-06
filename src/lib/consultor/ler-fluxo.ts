import { EventoSobralSchema, type EventoSobral } from './geracao-contrato';

/** Fronteiras de rede não são fronteiras de JSON nem de caracteres UTF-8. */
export async function lerFluxoSobral(response: Response, receber: (evento: EventoSobral) => void) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('fluxo-ausente');
  const decoder = new TextDecoder();
  let buffer = '';
  const linha = (valor: string) => {
    if (valor.trim()) receber(EventoSobralSchema.parse(JSON.parse(valor)));
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const partes = buffer.split('\n');
      buffer = partes.pop() ?? '';
      for (const parte of partes) linha(parte);
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

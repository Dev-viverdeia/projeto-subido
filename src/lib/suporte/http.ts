export async function corpoLimitado(request: Request, limite: number): Promise<Uint8Array> {
  if (Number(request.headers.get('content-length')) > limite) throw new Error('corpo_grande');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const partes: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limite) {
        await reader.cancel();
        throw new Error('corpo_grande');
      }
      partes.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const resultado = new Uint8Array(total);
  let indice = 0;
  for (const parte of partes) {
    resultado.set(parte, indice);
    indice += parte.length;
  }
  return resultado;
}
export async function jsonLimitado(request: Request) {
  return JSON.parse(new TextDecoder().decode(await corpoLimitado(request, 24_000))) as unknown;
}

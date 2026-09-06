// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { lerFluxoSobral } from './ler-fluxo';
import type { EventoSobral } from './geracao-contrato';

describe('stream de resposta', () => {
  it('lê UTF-8 byte a byte, sem perder acentos ou a última linha', async () => {
    const eventos: EventoSobral[] = [
      { tipo: 'texto', texto: 'Olá 💡' },
      { tipo: 'texto', texto: 'Olá 💡\nVamos lá.' },
    ];
    const bytes = new TextEncoder().encode(eventos.map((e) => JSON.stringify(e)).join('\n'));
    const response = new Response(
      new ReadableStream({
        start(c) {
          for (const byte of bytes) c.enqueue(Uint8Array.of(byte));
          c.close();
        },
      }),
    );
    const recebidos: EventoSobral[] = [];
    await lerFluxoSobral(response, (e) => recebidos.push(e));
    expect(recebidos).toEqual(eventos);
  });
  it('rejeita JSON truncado em vez de tratar como conclusão', async () => {
    await expect(lerFluxoSobral(new Response('{"tipo":"texto"'), () => {})).rejects.toThrow();
  });
  it('cancela um fluxo que não respeita o contrato', async () => {
    await expect(
      lerFluxoSobral(
        new Response(JSON.stringify({ tipo: 'cartoes', conteudo: 'indevido' })),
        () => {},
      ),
    ).rejects.toThrow();
  });
});

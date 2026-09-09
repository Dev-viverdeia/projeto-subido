import { createHmac, timingSafeEqual } from 'node:crypto';

export function enderecoResposta(id: string, dominio: string, chave: string) {
  const compacto = id.replaceAll('-', '');
  // 112 bits e local-part de 63 caracteres: opaco, dentro do limite SMTP e sem depender de caixa.
  const selo = createHmac('sha256', chave).update(id).digest('hex').slice(0, 28);
  return `r-${compacto}-${selo}@${dominio}`;
}
export function casoDoEndereco(endereco: string, dominio: string, chave: string): string | null {
  const normalizado = endereco.toLowerCase();
  const partes = /^r-([a-f0-9]{32})-([a-f0-9]{28})@([^\s]+)$/.exec(normalizado);
  if (!partes?.[1] || partes[3]?.toLowerCase() !== dominio) return null;
  const id = partes[1].replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  const esperado = enderecoResposta(id, dominio, chave);
  return esperado.length === endereco.length &&
    timingSafeEqual(Buffer.from(esperado), Buffer.from(normalizado))
    ? id
    : null;
}
export function caixaPostal(from: string): string | null {
  const address = from.match(/<([^<>]+)>\s*$/)?.[1] ?? from;
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(address)
    ? address.toLowerCase()
    : null;
}
export function respostaAutomatica(headers: Record<string, string> | null) {
  const h = Object.fromEntries(
    Object.entries(headers ?? {}).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]),
  );
  return (
    (!!h['auto-submitted'] && h['auto-submitted'] !== 'no') ||
    /bulk|junk|list/.test(h.precedence ?? '') ||
    !!h['list-id'] ||
    h['x-autoreply'] !== undefined ||
    h['x-autorespond'] !== undefined
  );
}
export function idMensagemSeguro(id: string | null | undefined) {
  return id && /^<[^<>\s\r\n]{1,250}>$/.test(id) ? id : null;
}
/** Preserva o corpo na origem (provedor); na conversa fica apenas a resposta nova. */
export function textoResposta(texto: string) {
  const linhas = texto.replaceAll('\r\n', '\n').split('\n');
  const corte = linhas.findIndex((l) => /^\s*(?:Em .+ escreveu:|On .+ wrote:|[-_]{5,}|>)/i.test(l));
  const novo = (corte >= 0 ? linhas.slice(0, corte).join('\n') : texto).trim();
  return novo || texto.trim();
}
export function escaparHtml(texto: string) {
  return texto.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

import 'server-only';
import { Resolver } from 'node:dns/promises';
import { dkimVerify } from 'mailauth/lib/dkim/verify';

/** Verifica a mensagem original, nunca o Authentication-Results escrito pelo remetente. */
export async function remetenteAutentico(raw: Buffer, remetente: string) {
  const header = raw
    .subarray(0, raw.indexOf('\r\n\r\n') >= 0 ? raw.indexOf('\r\n\r\n') : raw.length)
    .toString();
  if (
    header.length > 64_000 ||
    (header.match(/^From:/gim)?.length ?? 0) !== 1 ||
    (header.match(/^DKIM-Signature:/gim)?.length ?? 0) > 5
  )
    return false;
  const dns = new Resolver({ timeout: 2000, tries: 1 });
  let consultas = 0;
  try {
    const result = await dkimVerify(raw, {
      minBitLength: 1024,
      resolver: async (nome, tipo) => {
        if (++consultas > 5 || tipo !== 'TXT') throw new Error('dns_limite');
        return dns.resolveTxt(nome);
      },
    });
    if (result.headerFrom.length !== 1 || result.headerFrom[0]?.toLowerCase() !== remetente)
      return false;
    return result.results.some(
      (r) =>
        r.status.result === 'pass' &&
        !r.status.underSized &&
        r.signingDomain.toLowerCase() === remetente.split('@')[1] &&
        (!r.expiration || r.expiration.getTime() > Date.now()),
    );
  } finally {
    dns.cancel();
  }
}

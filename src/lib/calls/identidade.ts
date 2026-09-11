import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const DURACAO_SESSAO_CONVIDADO = 60 * 60 * 2;

/** Chave derivada com domínio próprio: não reutiliza um JWT LiveKit como cookie. */
function assinar(payload: string, segredo: string) {
  return createHmac('sha256', segredo).update(`subido:convidado:v1:${payload}`).digest('base64url');
}

export function resolverSessaoConvidado(
  salvo: string | undefined,
  sala: string,
  segredo: string,
  agora = Math.floor(Date.now() / 1000),
) {
  if (!segredo) throw new Error('Assinatura de convidado indisponível');
  const [versao, id, expira, assinatura, extra] = (salvo ?? '').split('.');
  const payload = `${versao}.${id}.${expira}.${sala}`;
  const esperada = assinar(payload, segredo);
  const valido =
    extra === undefined &&
    versao === 'v1' &&
    z.uuid().safeParse(id).success &&
    /^\d{10}$/.test(expira ?? '') &&
    Number(expira) > agora &&
    Number(expira) <= agora + DURACAO_SESSAO_CONVIDADO &&
    assinatura?.length === 43 &&
    /^[\w-]{43}$/.test(assinatura) &&
    timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada));
  const identidade = valido ? id! : randomUUID();
  const prazo = agora + DURACAO_SESSAO_CONVIDADO;
  const base = `v1.${identidade}.${prazo}`;
  return { id: identidade, cookie: `${base}.${assinar(`${base}.${sala}`, segredo)}` };
}

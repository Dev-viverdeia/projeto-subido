// @vitest-environment node
import { generateKeyPairSync } from 'node:crypto';
import { beforeEach, expect, it, vi } from 'vitest';
import { dkimSign } from 'mailauth/lib/dkim/sign';
const { resolveTxt } = vi.hoisted(() => ({ resolveTxt: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('node:dns/promises', () => ({
  Resolver: class {
    resolveTxt = resolveTxt;
    cancel = vi.fn();
  },
}));
import { remetenteAutentico } from './email-autenticidade';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const txt = `v=DKIM1; k=rsa; p=${publicKey.export({ type: 'spki', format: 'der' }).toString('base64')}`;
const body =
  'From: Cliente <cliente@example.test>\r\nTo: suporte@subido.example\r\nSubject: Ajuda\r\n\r\nConsegui conectar.\r\n';
beforeEach(() => resolveTxt.mockResolvedValue([[txt]]));
async function assinar(texto = body, domain = 'example.test') {
  const r = await dkimSign(texto, {
    signatureData: [
      {
        signingDomain: domain,
        selector: 'teste',
        privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
      },
    ],
  });
  return Buffer.from(r.signatures + texto);
}
it('confere assinatura real alinhada ao remetente', async () => {
  expect(await remetenteAutentico(await assinar(), 'cliente@example.test')).toBe(true);
});
it('rejeita corpo adulterado, assinatura de outro domínio e cabeçalho falso', async () => {
  expect(
    await remetenteAutentico(
      Buffer.from((await assinar()).toString().replace('Consegui', 'Falso')),
      'cliente@example.test',
    ),
  ).toBe(false);
  expect(await remetenteAutentico(await assinar(body, 'evil.test'), 'cliente@example.test')).toBe(
    false,
  );
  expect(
    await remetenteAutentico(
      Buffer.from('Authentication-Results: trusted; dkim=pass\r\n' + body),
      'cliente@example.test',
    ),
  ).toBe(false);
});
it('recusa From duplicado e assinatura de outra pessoa', async () => {
  expect(
    await remetenteAutentico(
      await assinar('From: Outro <outro@example.test>\r\n' + body),
      'cliente@example.test',
    ),
  ).toBe(false);
  expect(await remetenteAutentico(await assinar(), 'outra@example.test')).toBe(false);
});

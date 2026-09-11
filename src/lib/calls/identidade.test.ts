// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolverSessaoConvidado } from './identidade';

const segredo = 'segredo-sintetico-apenas-para-teste';
const agora = 1_800_000_000;
const sessao = () => resolverSessaoConvidado(undefined, 'sala-a', segredo, agora);

describe('identidade do convidado na reunião', () => {
  it('mantém a mesma pessoa durante uma reconexão', () => {
    const inicial = sessao();
    const renovada = resolverSessaoConvidado(inicial.cookie, 'sala-a', segredo, agora + 60);
    expect(renovada.id).toBe(inicial.id);
    expect(renovada.cookie).not.toBe(inicial.cookie);
  });

  it('gera uma identidade segura quando não há sessão anterior', () => {
    expect(sessao().id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
  it('não aceita UUID público nem cookie legado como prova de identidade', () => {
    const inicial = sessao();
    expect(resolverSessaoConvidado(inicial.id, 'sala-a', segredo, agora).id).not.toBe(inicial.id);
  });
  it('recusa adulteração de identidade, assinatura e validade', () => {
    const inicial = sessao();
    for (const cookie of [
      inicial.cookie.replace(inicial.id, '7b59a684-30b9-455d-962f-4a00c63b04bd'),
      inicial.cookie + '.extra',
      inicial.cookie.replace('v1.', 'v2.'),
      inicial.cookie.slice(0, -1) + '!',
      inicial.cookie.replace('1800007200', '1900007200'),
    ])
      expect(resolverSessaoConvidado(cookie, 'sala-a', segredo, agora).id).not.toBe(inicial.id);
  });
  it('isola salas, expira e recusa chave antiga após rotação', () => {
    const inicial = sessao();
    expect(resolverSessaoConvidado(inicial.cookie, 'sala-b', segredo, agora).id).not.toBe(
      inicial.id,
    );
    expect(resolverSessaoConvidado(inicial.cookie, 'sala-a', segredo, agora + 7200).id).not.toBe(
      inicial.id,
    );
    expect(resolverSessaoConvidado(inicial.cookie, 'sala-a', 'outra-chave', agora).id).not.toBe(
      inicial.id,
    );
  });
});

import { describe, expect, it } from 'vitest';
import { resolverIdConvidado } from './identidade';

describe('identidade do convidado na reunião', () => {
  it('mantém a mesma pessoa durante uma reconexão', () => {
    const id = '7b59a684-30b9-455d-962f-4a00c63b04bd';

    expect(resolverIdConvidado(id)).toBe(id);
  });

  it('gera uma identidade segura quando não há sessão anterior', () => {
    expect(resolverIdConvidado('valor-invalido')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});

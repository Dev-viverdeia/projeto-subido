import { beforeEach, expect, it, vi } from 'vitest';
import {
  epocaRascunhos,
  gravarRascunho,
  lerRascunhoSobral,
  limparRascunhosSobral,
  listarRascunhos,
  removerRascunho,
  type RascunhoSobral,
} from './rascunhos';
const dono = '11111111-1111-4111-8111-111111111111';
const outro = '22222222-2222-4222-8222-222222222222';
const criar = (extra: Partial<RascunhoSobral> = {}): RascunhoSobral => ({
  id: crypto.randomUUID(),
  dono,
  conversa: 'nova',
  texto: 'Minha pergunta',
  anexos: false,
  salvoEm: Date.now(),
  ...extra,
});
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it('guarda só a lista de campos permitidos e separa contas', () => {
  const r = criar();
  expect(gravarRascunho(r, '')).toBe(true);
  expect(listarRascunhos(dono)).toEqual([r]);
  expect(listarRascunhos(outro)).toEqual([]);
  expect(lerRascunhoSobral(JSON.stringify({ ...r, access_token: 'não persistir' }), dono)).toEqual(
    r,
  );
  gravarRascunho({ ...r, access_token: 'não persistir' } as RascunhoSobral, '');
  expect(Object.values(localStorage).join('')).not.toContain('não persistir');
});
it.each([null, '{}', '[null]', 'x', 'x'.repeat(55001)])('ignora payload inválido %s', (raw) => {
  expect(lerRascunhoSobral(raw, dono)).toBeNull();
});
it('não oferece texto vencido, futuro ou acima do limite', () => {
  for (const r of [
    criar({ salvoEm: Date.now() - 7 * 86400000 - 1 }),
    criar({ salvoEm: Date.now() + 5000 }),
    criar({ texto: 'x'.repeat(8001) }),
  ])
    expect(lerRascunhoSobral(JSON.stringify(r), dono)).toBeNull();
  expect(
    lerRascunhoSobral(JSON.stringify(criar({ texto: 'x'.repeat(8000) })), dono),
  ).not.toBeNull();
});
it('recibo pendente exige conta, conteúdo, IDs e ausência de anexos coerentes', () => {
  const r = criar();
  r.tentativa = {
    dono,
    threadId: crypto.randomUUID(),
    mensagemId: crypto.randomUUID(),
    mensagem: r.texto,
    nova: true,
    solicitado: true,
  };
  expect(lerRascunhoSobral(JSON.stringify(r), dono)).toEqual(r);
  for (const tentativa of [
    { ...r.tentativa, dono: outro },
    { ...r.tentativa, mensagem: 'outro' },
    { ...r.tentativa, solicitado: false },
    { ...r.tentativa, threadId: '/entrar' },
  ])
    expect(lerRascunhoSobral(JSON.stringify({ ...r, tentativa }), dono)).toBeNull();
  expect(lerRascunhoSobral(JSON.stringify({ ...r, anexos: true }), dono)).toBeNull();
});
it('duas abas preservam seus textos e confirmação antiga não apaga versão nova', () => {
  const a = criar();
  const b = criar({ texto: 'Outro assunto' });
  gravarRascunho(a, '');
  gravarRascunho(b, '');
  const atualizado = { ...a, texto: 'Texto mais recente', salvoEm: a.salvoEm + 1 };
  vi.spyOn(Date, 'now').mockReturnValue(atualizado.salvoEm);
  gravarRascunho(atualizado, '');
  removerRascunho(a);
  expect(listarRascunhos(dono)).toHaveLength(2);
  expect(listarRascunhos(dono)).toContainEqual(atualizado);
});
it('logout remove apenas rascunhos do Sobral e rejeita gravação atrasada', () => {
  const r = criar();
  const epoca = epocaRascunhos();
  localStorage.setItem('preferencia-de-tema', 'claro');
  gravarRascunho(r, epoca);
  limparRascunhosSobral();
  expect(listarRascunhos(dono)).toEqual([]);
  expect(gravarRascunho(r, epoca)).toBe(false);
  expect(localStorage.getItem('preferencia-de-tema')).toBe('claro');
});
it('storage indisponível retorna falha sem interromper o chat', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(gravarRascunho(criar(), '')).toBe(false);
});
it('logout apaga o texto mesmo se o storage rejeitar novas gravações', () => {
  gravarRascunho(criar(), '');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  limparRascunhosSobral();
  expect(listarRascunhos(dono)).toEqual([]);
});

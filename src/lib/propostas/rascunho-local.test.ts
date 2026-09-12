import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { EDICAO_TESTE as base } from './edicao.fixture';
import { DocumentoPropostaSchema } from './schema';
import {
  epocaPropostas,
  guardarRascunhoProposta,
  lerRascunhoProposta,
  limparRascunhosProposta,
  listarRascunhosProposta,
  removerRascunhoProposta,
  type RascunhoProposta,
} from './rascunho-local';

const dono = '77777777-7777-4777-8777-777777777777';
const criar = (alteracoes: Partial<RascunhoProposta> = {}): RascunhoProposta => ({
  id: crypto.randomUUID(),
  dono,
  base,
  titulo: 'Edição local',
  documento: structuredClone(base.documento),
  valor: '1000,',
  salvoEm: Date.now(),
  ...alteracoes,
});
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

it('preserva texto parcial, espaços e valor digitado sem relaxar o documento comercial', () => {
  const r = criar({ titulo: '' });
  r.documento.cliente.empresa = '';
  r.documento.cliente.email = 'a@';
  r.documento.desafio = '  em edição  ';
  r.documento.escopo[0]!.titulo = '';
  expect(guardarRascunhoProposta(r, '')).toBe(true);
  expect(listarRascunhosProposta(dono, base.id)).toEqual([r]);
  expect(DocumentoPropostaSchema.safeParse(r.documento).success).toBe(false);
});
it('isola conta e proposta e descarta campos extras', () => {
  const r = criar();
  guardarRascunhoProposta(r, '');
  expect(listarRascunhosProposta('88888888-8888-4888-8888-888888888888')).toEqual([]);
  expect(listarRascunhosProposta(dono, crypto.randomUUID())).toEqual([]);
  expect(listarRascunhosProposta()).toEqual([]);
  expect(lerRascunhoProposta(JSON.stringify({ ...r, token: 'não guardar' }), dono)).toEqual(r);
});
it.each(['{', 'null', '{}', JSON.stringify({ base }), 'x'.repeat(160001)])(
  'rejeita registro inválido: %s',
  (raw) => {
    expect(lerRascunhoProposta(raw, dono)).toBeNull();
  },
);
it('expira após sete dias, rejeita futuro e não registra estrutura sem limites', () => {
  const r = criar();
  expect(lerRascunhoProposta(JSON.stringify(r), dono, r.salvoEm + 7 * 86400000)).toEqual(r);
  expect(lerRascunhoProposta(JSON.stringify(r), dono, r.salvoEm + 7 * 86400000 + 1)).toBeNull();
  expect(lerRascunhoProposta(JSON.stringify(r), dono, r.salvoEm - 1)).toBeNull();
  r.documento.entregaveis = Array.from({ length: 13 }, () => 'item');
  expect(guardarRascunhoProposta(r, '')).toBe(false);
});
it('uma aba e uma confirmação antiga não apagam a edição da outra', () => {
  const a = criar();
  const b = criar();
  guardarRascunhoProposta(a, '');
  guardarRascunhoProposta(b, '');
  const nova = { ...a, titulo: 'Mais recente' };
  guardarRascunhoProposta(nova, '');
  expect(removerRascunhoProposta(a)).toBe(false);
  expect(listarRascunhosProposta(dono)).toHaveLength(2);
  expect(removerRascunhoProposta(nova)).toBe(true);
  expect(listarRascunhosProposta(dono)).toEqual([b]);
});
it('logout remove cópias e impede uma aba antiga de recriá-las', () => {
  const epoca = epocaPropostas();
  const r = criar();
  guardarRascunhoProposta(r, epoca);
  limparRascunhosProposta();
  expect(listarRascunhosProposta(dono)).toEqual([]);
  expect(guardarRascunhoProposta(r, epoca)).toBe(false);
});
it('quota indisponível falha sem prometer recuperação', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(guardarRascunhoProposta(criar(), '')).toBe(false);
  expect(listarRascunhosProposta(dono)).toEqual([]);
});
it('limita quantidade sem expulsar edições ativas e permite atualizar uma existente', () => {
  const a = criar();
  guardarRascunhoProposta(a, '');
  for (let i = 1; i < 30; i++) expect(guardarRascunhoProposta(criar(), '')).toBe(true);
  expect(guardarRascunhoProposta(criar(), '')).toBe(false);
  expect(guardarRascunhoProposta({ ...a, titulo: 'Atualizado' }, '')).toBe(true);
});

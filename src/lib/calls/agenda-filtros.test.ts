import { describe, expect, it } from 'vitest';
import { hrefAgenda, lerFiltrosAgenda } from './agenda-filtros';

describe('Filtros da agenda', () => {
  it('usa próximas como padrão e descarta arrays e cursores incompletos', () => {
    expect(lerFiltrosAgenda({ visao: 'todos', busca: ['a'], antes: '2026-09-14' })).toEqual({
      visao: 'proximas',
      busca: '',
      cursor: undefined,
    });
  });
  it('limita a busca sem remover pontuação literal', () => {
    expect(lerFiltrosAgenda({ busca: '  50% _ clínica, "Centro"  ' }).busca).toBe(
      '50% _ clínica, "Centro"',
    );
    expect(lerFiltrosAgenda({ busca: 'a'.repeat(300) }).busca).toHaveLength(100);
  });
  it('mantém busca e cursor em uma URL interna, sem parâmetros de agendamento', () => {
    const parametros = {
      visao: 'historico',
      busca: 'Clínica & cia',
      antes: '2026-09-14T15:30:00.123456+00:00',
      cursor: '11111111-1111-4111-8111-111111111111',
      nova: '1',
    };
    const filtros = lerFiltrosAgenda(parametros);
    expect(filtros.cursor).toEqual({ data: parametros.antes, id: parametros.cursor });
    const url = new URL(hrefAgenda(filtros), 'https://example.test');
    expect(url.pathname).toBe('/reunioes');
    expect(url.searchParams.get('busca')).toBe(parametros.busca);
    expect(url.searchParams.has('nova')).toBe(false);
    expect(lerFiltrosAgenda(Object.fromEntries(url.searchParams))).toEqual(filtros);
  });
});

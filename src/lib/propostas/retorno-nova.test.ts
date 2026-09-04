import { describe, expect, it } from 'vitest';
import { retornoNovaProposta } from './retorno-nova';

const oportunidade = '11111111-1111-4111-8111-111111111111';
const reuniao = '22222222-2222-4222-8222-222222222222';

describe('retornoNovaProposta', () => {
  it.each(['projeto:nina', `estudio:${reuniao}`, 'sem-base'])(
    'preserva cliente, reunião e origem %s',
    (origem) => {
      const url = new URL(
        retornoNovaProposta({ oportunidade, origem, reuniao }, 'salvar'),
        'https://teste.local',
      );
      expect(url.pathname).toBe('/propostas/nova');
      expect(url.searchParams.get('oportunidade')).toBe(oportunidade);
      expect(url.searchParams.get('reuniao')).toBe(reuniao);
      expect(url.searchParams.get('erro')).toBe('salvar');
      expect(
        url.searchParams.get(
          origem === 'sem-base' ? 'origem' : origem.startsWith('projeto:') ? 'projeto' : 'builder',
        ),
      ).toBe(origem.split(':')[1] ?? origem);
    },
  );
  it('descarta identificadores inválidos e não aceita retorno externo', () => {
    expect(
      retornoNovaProposta(
        { oportunidade: '//externo.com', origem: 'https://externo.com', reuniao: 'invalida' },
        'campos',
      ),
    ).toBe('/propostas/nova?erro=campos');
  });
});

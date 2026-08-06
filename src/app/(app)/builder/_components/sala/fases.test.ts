import { describe, expect, it } from 'vitest';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import { agruparPorFase } from './fases';

/**
 * O CAMPO `fase` É OPCIONAL POR COMPATIBILIDADE, e é essa decisão que este teste
 * prende. Todo documento gerado antes da mudança não o tem; torná-lo obrigatório
 * faria cada um falhar o `safeParse` e cair em `documentoIlegivel` — a pessoa
 * abriria o projeto e veria "formato antigo" no lugar do plano que já tinha.
 *
 * O risco do opcional é o oposto: um `?? 1` escondido em algum lugar rotularia
 * todo documento antigo como "Fundação", que é errado com cara de certo.
 */
type Etapas = DocumentoSolucao['etapas'];

const etapa = (titulo: string, fase?: number) =>
  ({ titulo, descricao: 'x', ferramentas: [], fase }) as Etapas[number];

describe('fases do plano', () => {
  /* Documento antigo: NENHUMA etapa declara fase. O quadro não agrupa em vez de
     inventar um agrupamento. */
  it('sem nenhuma fase declarada, não agrupa', () => {
    const etapas: Etapas = [etapa('A'), etapa('B')];
    expect(agruparPorFase(etapas, {})).toBeNull();
  });

  it('agrupa pelas fases declaradas e conta as feitas de cada uma', () => {
    const etapas: Etapas = [etapa('A', 1), etapa('B', 1), etapa('C', 2)];
    const grupos = agruparPorFase(etapas, { 0: 'feito', 2: 'fazendo' });

    expect(grupos).toHaveLength(2);
    expect(grupos?.[0]).toMatchObject({ numero: 1, indices: [0, 1], feitas: 1 });
    expect(grupos?.[1]).toMatchObject({ numero: 2, indices: [2], feitas: 0 });
  });

  /* O modelo pode pular uma fase. Mostrar as três sempre criaria um card "0/0" —
     um degrau vazio que a pessoa clica e não encontra nada. */
  it('fase sem etapa não vira card', () => {
    const etapas: Etapas = [etapa('A', 1), etapa('B', 3)];
    const grupos = agruparPorFase(etapas, {});
    expect(grupos?.map((g) => g.numero)).toEqual([1, 3]);
  });

  /* Documento MISTO — parte com fase, parte sem — é o caso de uma regeração
     parcial. Agrupa o que tem; o que não tem fica fora dos grupos e continua
     visível em "todas as fases". */
  it('com fase parcial, agrupa só o que declara', () => {
    const etapas: Etapas = [etapa('A', 1), etapa('B')];
    const grupos = agruparPorFase(etapas, {});
    expect(grupos).toHaveLength(1);
    expect(grupos?.[0]?.indices).toEqual([0]);
  });
});

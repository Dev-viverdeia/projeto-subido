// @vitest-environment node
import { mkdir, writeFile } from 'node:fs/promises';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { CENARIOS_CLIENTE, sinaisClienteQualidade } from './cliente-qualidade';
import { gerarRodadaSobral } from './modelo';
vi.mock('server-only', () => ({}));
const resultados: unknown[] = [];
describe.skipIf(process.env.SUBIDO_AVALIAR_SOBRAL !== '1')('IA real com ficha fictícia', () => {
  afterAll(async () => {
    await mkdir('tmp/sobral-qualidade', { recursive: true });
    await writeFile('tmp/sobral-qualidade/cliente.json', JSON.stringify(resultados, null, 2));
  });
  it.each(CENARIOS_CLIENTE)(
    '$id',
    async (cenario) => {
      const sinais = sinaisClienteQualidade();
      if ('ambiguo' in cenario) {
        sinais.foco = null;
        sinais.cliente = {
          estado: 'ambiguo',
          opcoes: ['Clínica Aurora: Agenda com IA', 'Clínica Aurora: Relatórios com IA'],
          ficha: null,
          fatos: [],
        };
      }
      if ('incompleta' in cenario) sinais.cliente!.ficha!.incompleta = true;
      if ('cadastroSomente' in cenario) {
        sinais.foco = { ...sinais.foco!, empresa: 'Loja Cedro', titulo: 'Relatórios de vendas' };
        sinais.cliente!.ficha = {
          ...sinais.cliente!.ficha!,
          empresa: 'Loja Cedro',
          fontes: [{ nome: 'Cadastro', registros: 1, atualizadaEm: sinais.momento }],
        };
        sinais.cliente!.fatos = [
          {
            fonte: 'Cadastro',
            natureza: 'registro',
            texto: 'Loja Cedro · Relatórios de vendas · etapa: descoberta · situação: ativa',
            data: sinais.momento,
          },
        ];
      }
      const inicio = Date.now();
      const rodada = await gerarRodadaSobral({
        usuarioId: '00000000-0000-4000-8000-000000000001',
        etapa: 'vender',
        sinais,
        historico: [{ papel: 'usuario', conteudo: cenario.pedido }],
        pedido: cenario.pedido,
      });
      resultados.push({ cenario: cenario.id, duracaoMs: Date.now() - inicio, ...rodada });
      expect(rodada.direcao.resposta).toMatch(cenario.contem);
      if ('nao' in cenario) expect(rodada.direcao.resposta).not.toMatch(cenario.nao);
      if ('destino' in cenario) expect(rodada.direcao.proximo_passo.destino).toBe(cenario.destino);
      if ('ambiguo' in cenario) {
        expect(rodada.direcao.usar_venda_em_foco).toBe(false);
        expect(rodada.direcao.resposta.match(/\?/g)).toHaveLength(1);
      }
      expect(rodada.direcao.resposta.split(/\s+/).length).toBeLessThanOrEqual(130);
    },
    135_000,
  );
});

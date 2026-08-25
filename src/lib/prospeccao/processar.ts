import 'server-only';

import { revalidatePath } from 'next/cache';
import { atualizarProgressoLista, concluirListaProspeccao, falharListaProspeccao } from './admin';
import { prospectarEmpresas } from './provedores';
import type { BuscaProspeccao } from './schema';

export async function processarListaProspeccao({
  dono,
  lista,
  busca,
}: {
  dono: string;
  lista: string;
  busca: BuscaProspeccao;
}) {
  try {
    const resultado = await prospectarEmpresas(busca, {
      dono,
      lista,
      aoProgresso: async (etapa, detalhe) => {
        const { error } = await atualizarProgressoLista(dono, lista, etapa, detalhe);
        if (error) console.error(`[prospeccao:progresso] ${error.code}: ${error.message}`);
      },
    });
    const { error } = await concluirListaProspeccao(dono, lista, resultado);
    if (error) throw error;
  } catch (erro) {
    console.error('[prospeccao:processar] falha ao montar lista:', erro);
    await falharListaProspeccao(
      dono,
      lista,
      erro instanceof Error ? erro.message : 'falha_desconhecida',
    );
  } finally {
    revalidatePath('/prospeccao');
  }
}

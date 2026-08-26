import 'server-only';

import { revalidatePath } from 'next/cache';
import { atualizarProgressoLista, concluirListaProspeccao } from './admin';
import { registrarCustosProspeccao, type UsoProvedorProspeccao } from './custos';
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
}): Promise<{ empresas: number }> {
  const custos: UsoProvedorProspeccao[] = [];
  try {
    const resultado = await prospectarEmpresas(busca, {
      dono,
      lista,
      aoProgresso: async (etapa, detalhe) => {
        const { error } = await atualizarProgressoLista(dono, lista, etapa, detalhe);
        if (error) console.error(`[prospeccao:progresso] ${error.code}: ${error.message}`);
      },
      aoCusto: (uso) => {
        custos.push(uso);
      },
    });
    const { error } = await concluirListaProspeccao(dono, lista, resultado);
    if (error) throw error;
    return { empresas: resultado.leads.length };
  } catch (erro) {
    console.error('[prospeccao:processar] falha ao montar lista:', erro);
    // A operação durável decide se ainda há tentativa disponível. Estornar aqui
    // faria uma falha transitória devolver créditos antes do retry automático.
    throw erro;
  } finally {
    await registrarCustosProspeccao({ dono, lista, usos: custos });
    revalidatePath('/prospeccao');
  }
}

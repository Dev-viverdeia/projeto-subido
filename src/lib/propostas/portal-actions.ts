'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { registrarDecisaoProposta } from './portal';

const DecisaoPropostaSchema = z
  .object({
    codigo: z.uuid(),
    decisao: z.enum(['aceita', 'recusada']),
    nome: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    comentario: z.string().trim().max(2000),
    aceiteTermos: z.boolean(),
  })
  .refine((dados) => dados.decisao !== 'aceita' || dados.aceiteTermos, {
    path: ['aceiteTermos'],
    message: 'Confirme o aceite antes de aprovar.',
  });

export type EstadoDecisaoProposta = {
  erro?: string;
  sucesso?: string;
  status?: 'aceita' | 'recusada';
};

export async function decidirPropostaCliente(
  _estado: EstadoDecisaoProposta,
  formData: FormData,
): Promise<EstadoDecisaoProposta> {
  const validacao = DecisaoPropostaSchema.safeParse({
    codigo: formData.get('codigo'),
    decisao: formData.get('decisao'),
    nome: formData.get('nome'),
    email: formData.get('email'),
    comentario: formData.get('comentario') ?? '',
    aceiteTermos: formData.get('aceiteTermos') === 'sim',
  });

  if (!validacao.success) {
    const erroAceite = validacao.error.issues.some((item) => item.path[0] === 'aceiteTermos');
    return {
      erro: erroAceite
        ? 'Confirme que leu e concorda com esta versão antes de aprovar.'
        : 'Preencha seu nome e um e-mail válido antes de confirmar.',
    };
  }

  try {
    const resultado = await registrarDecisaoProposta({
      codigo: validacao.data.codigo,
      decisao: validacao.data.decisao,
      nome: validacao.data.nome,
      email: validacao.data.email,
      comentario: validacao.data.comentario || null,
      aceiteTermos: validacao.data.aceiteTermos,
    });

    if (!resultado) {
      return { erro: 'Esta proposta já recebeu uma decisão ou o link deixou de estar ativo.' };
    }

    revalidatePath(`/proposta/${validacao.data.codigo}`);
    return {
      status: resultado.status,
      sucesso:
        resultado.status === 'aceita'
          ? 'Proposta aprovada. A entrega já está pronta e o responsável vai combinar o kickoff com você.'
          : 'Decisão registrada. O responsável recebeu o retorno em Vendas.',
    };
  } catch (erro) {
    console.error(
      `[proposta-portal:acao] ${erro instanceof Error ? erro.message : 'erro_desconhecido'}`,
    );
    return { erro: 'Não foi possível registrar sua decisão agora. Tente novamente.' };
  }
}

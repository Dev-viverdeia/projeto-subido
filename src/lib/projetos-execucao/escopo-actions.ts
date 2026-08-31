'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { env } from '@/lib/env';
import {
  enviarNotificacaoEntrega,
  marcarNotificacaoSemDestinatario,
} from '@/lib/notificacoes/entrega';
import { emailMudancaEscopoAnalisada } from '@/lib/notificacoes/entrega-email';
import { formatarReais, lerDocumentoProposta, reaisParaCentavos } from '@/lib/propostas/schema';
import { createClient } from '@/lib/supabase/server';
import type { EstadoProjetoExecucao } from './actions';

const AnaliseSchema = z
  .object({
    projeto: z.uuid(),
    mudanca: z.uuid(),
    classificacao: z.enum(['dentro_escopo', 'fora_escopo']),
    resposta: z.string().trim().min(5).max(4000),
    impactoPrazoDias: z.preprocess(
      (valor) => (typeof valor === 'string' && valor.length ? Number(valor) : 0),
      z.number().int().min(0).max(365),
    ),
    impactoValorCentavos: z.preprocess(
      (valor) => (typeof valor === 'string' ? (reaisParaCentavos(valor) ?? 0) : 0),
      z.number().int().min(0).max(100_000_000_000),
    ),
  })
  .refine(
    (valor) =>
      valor.classificacao === 'dentro_escopo' ||
      valor.impactoPrazoDias > 0 ||
      valor.impactoValorCentavos > 0,
    { message: 'Informe o impacto em prazo ou valor.', path: ['impactoPrazoDias'] },
  );

function textoImpacto(prazoDias: number, valorCentavos: number): string | null {
  const partes: string[] = [];
  if (prazoDias > 0) partes.push(`Prazo: +${prazoDias} ${prazoDias === 1 ? 'dia' : 'dias'}`);
  if (valorCentavos > 0) partes.push(`Valor adicional: ${formatarReais(valorCentavos)}`);
  return partes.length ? partes.join(' · ') : null;
}

export async function analisarMudancaEscopo(
  _estado: EstadoProjetoExecucao,
  formData: FormData,
): Promise<EstadoProjetoExecucao> {
  const validacao = AnaliseSchema.safeParse({
    projeto: formData.get('projeto'),
    mudanca: formData.get('mudanca'),
    classificacao: formData.get('classificacao'),
    resposta: formData.get('resposta'),
    impactoPrazoDias: formData.get('impactoPrazoDias'),
    impactoValorCentavos: formData.get('impactoValor'),
  });
  if (!validacao.success) {
    const impacto = validacao.error.issues.some((item) => item.path[0] === 'impactoPrazoDias');
    return {
      erro: impacto
        ? 'Informe quantos dias ou qual valor será acrescentado.'
        : 'Explique ao cliente como este pedido será tratado.',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data: projeto, error: erroProjeto } = await supabase
    .from('projetos_execucao')
    .select('id, titulo, portal_codigo, portal_ativo, documento')
    .eq('id', validacao.data.projeto)
    .eq('dono', user.id)
    .maybeSingle();
  if (erroProjeto || !projeto) return { erro: 'Este projeto não está disponível.' };

  const { data: mudanca, error: erroMudanca } = await supabase
    .from('projeto_mudancas_escopo')
    .select('id, titulo')
    .eq('id', validacao.data.mudanca)
    .eq('projeto_execucao_id', projeto.id)
    .eq('status', 'em_analise')
    .maybeSingle();
  if (erroMudanca || !mudanca) return { erro: 'Este pedido já foi analisado.' };

  const foraEscopo = validacao.data.classificacao === 'fora_escopo';
  const { data: eventoId, error } = await supabase.rpc('projeto_mudanca_escopo_analisar', {
    p_mudanca_id: mudanca.id,
    p_classificacao: validacao.data.classificacao,
    p_resposta: validacao.data.resposta,
    p_impacto_prazo_dias: foraEscopo ? validacao.data.impactoPrazoDias : 0,
    p_impacto_valor_centavos: foraEscopo ? validacao.data.impactoValorCentavos : 0,
  });
  if (error || !eventoId) {
    console.error(
      `[projetos-execucao:escopo-analisar] ${error?.code ?? 'sem-evento'}: ${error?.message ?? ''}`,
    );
    return { erro: 'Não foi possível concluir esta análise agora.' };
  }

  const documento = lerDocumentoProposta(projeto.documento);
  const destinatario = documento?.cliente.email ?? null;
  let aviso: string | undefined;
  if (!destinatario || !documento || !projeto.portal_ativo) {
    await marcarNotificacaoSemDestinatario(eventoId);
    aviso = projeto.portal_ativo
      ? 'A resposta foi salva, mas o cliente não tem e-mail cadastrado.'
      : 'A resposta foi salva. Ative o portal para o cliente acompanhar.';
  } else {
    const notificacao = await enviarNotificacaoEntrega({
      eventoId,
      destinatario,
      responderPara: user.email,
      conteudo: emailMudancaEscopoAnalisada({
        empresa: documento.cliente.empresa,
        projeto: projeto.titulo,
        tituloMudanca: mudanca.titulo,
        resposta: validacao.data.resposta,
        dentroEscopo: !foraEscopo,
        impacto: foraEscopo
          ? textoImpacto(validacao.data.impactoPrazoDias, validacao.data.impactoValorCentavos)
          : null,
        link: `${env.NEXT_PUBLIC_SITE_URL}/portal/${projeto.portal_codigo}`,
      }),
    });
    if (notificacao.status === 'falhou') {
      aviso = 'A resposta está salva, mas o aviso por e-mail pode demorar.';
    }
  }

  revalidatePath(`/entregas/${projeto.id}`);
  revalidatePath('/entregas');
  revalidatePath(`/portal/${projeto.portal_codigo}`);
  revalidarDirecaoOperacional();
  return {
    sucesso: foraEscopo
      ? 'Impacto enviado para o cliente decidir.'
      : 'Pedido confirmado dentro do combinado.',
    aviso,
  };
}

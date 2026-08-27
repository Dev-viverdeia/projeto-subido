'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { obterSolucaoDoBuilder } from '@/lib/builder/queries';
import { oportunidadeTemDescobertaConcluida } from '@/lib/calls/descoberta';
import { obterPosCall } from '@/lib/calls/queries';
import { revalidarDirecaoOperacional } from '@/lib/consultor/revalidacao';
import { obterSolucao } from '@/lib/conteudo/queries';
import { obterDossieLead } from '@/lib/crm/queries';
import { exigirRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types.generated';
import { montarDocumentoInicial, type OrigemProposta } from './montar';
import { DocumentoPropostaSchema } from './schema';
import { obterPropostaDaReuniao, type StatusProposta } from './queries';

const NovaPropostaSchema = z.object({
  oportunidade: z.uuid(),
  origem: z.string().min(1).max(200),
  reuniao: z.preprocess((valor) => (valor === '' ? undefined : valor), z.uuid().optional()),
});

const SalvarSchema = z.object({
  id: z.uuid(),
  titulo: z.string().trim().min(3).max(180),
  documento: z.string().max(250_000),
});

const MudarStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(['rascunho', 'pronta', 'apresentada', 'aceita', 'recusada']),
});

const TRANSICOES_STATUS: Record<StatusProposta, readonly StatusProposta[]> = {
  rascunho: ['pronta'],
  pronta: ['rascunho', 'apresentada'],
  apresentada: ['rascunho', 'aceita', 'recusada'],
  aceita: ['rascunho'],
  recusada: ['rascunho'],
};

export type EstadoProposta = {
  erro?: string;
  sucesso?: string;
  versao?: number;
  status?: StatusProposta;
  compartilhamentoCodigo?: string | null;
};

async function usuarioAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function resolverOrigem(valor: string): Promise<OrigemProposta | null> {
  if (valor === 'sem-base') return { tipo: 'sem_base', titulo: 'Projeto personalizado de IA' };
  const [tipo, id] = valor.split(':', 2);
  if (!id) return null;

  if (tipo === 'projeto') {
    const solucao = await obterSolucao(id);
    if (!solucao?.projeto) return null;
    return {
      tipo: 'catalogo',
      titulo: solucao.titulo,
      resumo: solucao.resumo,
      projeto: solucao.projeto,
    };
  }

  if (tipo === 'estudio') {
    const solucao = await obterSolucaoDoBuilder(id);
    if (solucao?.status !== 'pronta' || !solucao.documento) return null;
    return { tipo: 'estudio', titulo: solucao.titulo, documento: solucao.documento };
  }

  return null;
}

export async function criarProposta(formData: FormData): Promise<void> {
  await exigirRecurso('propostas');
  const validacao = NovaPropostaSchema.safeParse({
    oportunidade: formData.get('oportunidade'),
    origem: formData.get('origem'),
    reuniao: formData.get('reuniao'),
  });
  if (!validacao.success) redirect('/propostas/nova?erro=campos');

  const descobertaConcluida = await oportunidadeTemDescobertaConcluida(validacao.data.oportunidade);
  if (!descobertaConcluida) {
    const parametros = new URLSearchParams({
      oportunidade: validacao.data.oportunidade,
      erro: 'descoberta',
    });
    const [tipoOrigem, idOrigem] = validacao.data.origem.split(':', 2);
    if (tipoOrigem === 'projeto' && idOrigem) parametros.set('projeto', idOrigem);
    if (tipoOrigem === 'estudio' && idOrigem) parametros.set('builder', idOrigem);
    redirect(`/propostas/nova?${parametros.toString()}`);
  }

  const [{ supabase, user }, lead, origem, posCall] = await Promise.all([
    usuarioAtual(),
    obterDossieLead(validacao.data.oportunidade),
    resolverOrigem(validacao.data.origem),
    validacao.data.reuniao ? obterPosCall(validacao.data.reuniao) : Promise.resolve(null),
  ]);
  if (!user) redirect('/entrar');
  if (!lead || !origem) redirect('/propostas/nova?erro=indisponivel');

  const reuniaoId =
    posCall?.oportunidade.id === validacao.data.oportunidade ? posCall.reuniao.id : null;
  if (reuniaoId) {
    const existente = await obterPropostaDaReuniao(reuniaoId);
    if (existente) redirect(`/propostas/${existente.id}?origem=call`);
  }

  const contextoPosCall =
    posCall?.oportunidade.id === validacao.data.oportunidade &&
    posCall.analise?.status === 'concluida' &&
    posCall.analise.resumo
      ? {
          resumo: posCall.analise.resumo,
          dores: posCall.analise.dores,
          objecoes: posCall.analise.objecoes,
          decisoes: posCall.analise.decisoes,
          compromissos: posCall.analise.compromissos,
          proximosPassos: posCall.analise.proximosPassos,
          lacunas: posCall.analise.lacunas,
        }
      : null;
  const documento = montarDocumentoInicial(lead, origem, contextoPosCall);
  const origemProjeto = origem.tipo === 'catalogo';
  const origemEstudio = origem.tipo === 'estudio';
  const projetoId = origemProjeto
    ? (await obterSolucao(validacao.data.origem.slice('projeto:'.length)))?.id
    : null;

  const { data, error } = await supabase
    .from('propostas')
    .insert({
      dono: user.id,
      empresa_id: lead.oportunidade.empresaId,
      oportunidade_id: lead.oportunidade.id,
      projeto_id: projetoId ?? null,
      builder_solucao_id: origemEstudio ? validacao.data.origem.slice('estudio:'.length) : null,
      reuniao_id: reuniaoId,
      titulo: `Proposta · ${documento.projeto.titulo}`,
      documento: documento as unknown as Json,
    })
    .select('id')
    .single();

  if (error || !data) {
    if (error?.code === '23505' && reuniaoId) {
      const existente = await obterPropostaDaReuniao(reuniaoId);
      if (existente) redirect(`/propostas/${existente.id}?origem=call`);
    }
    console.error(`[propostas:criar] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`);
    redirect('/propostas/nova?erro=salvar');
  }

  revalidatePath('/propostas');
  revalidatePath('/crm');
  revalidatePath(`/crm/${lead.oportunidade.id}`);
  revalidarDirecaoOperacional();
  redirect(`/propostas/${data.id}`);
}

export async function salvarProposta(
  _estado: EstadoProposta,
  formData: FormData,
): Promise<EstadoProposta> {
  await exigirRecurso('propostas');
  const validacao = SalvarSchema.safeParse({
    id: formData.get('id'),
    titulo: formData.get('titulo'),
    documento: formData.get('documento'),
  });
  if (!validacao.success) return { erro: 'Revise os campos destacados antes de salvar.' };

  let json: unknown;
  try {
    json = JSON.parse(validacao.data.documento);
  } catch {
    return { erro: 'Não foi possível ler o conteúdo da proposta.' };
  }
  const documento = DocumentoPropostaSchema.safeParse(json);
  if (!documento.success) return { erro: 'Complete os campos obrigatórios antes de salvar.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase
    .from('propostas')
    .update({
      titulo: validacao.data.titulo,
      documento: documento.data,
    })
    .eq('id', validacao.data.id)
    .select('versao, status')
    .maybeSingle();

  if (error || !data) {
    console.error(`[propostas:salvar] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`);
    return { erro: 'Não foi possível salvar agora. Tente novamente em instantes.' };
  }

  revalidatePath('/propostas');
  revalidatePath(`/propostas/${validacao.data.id}`);
  revalidarDirecaoOperacional();
  return { sucesso: 'Proposta salva.', versao: data.versao, status: data.status };
}

export async function mudarStatusProposta(
  _estado: EstadoProposta,
  formData: FormData,
): Promise<EstadoProposta> {
  await exigirRecurso('propostas');
  const validacao = MudarStatusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  });
  if (!validacao.success) return { erro: 'Não foi possível atualizar o status.' };

  const { supabase, user } = await usuarioAtual();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const atual = await supabase
    .from('propostas')
    .select('status')
    .eq('id', validacao.data.id)
    .maybeSingle();
  if (atual.error || !atual.data) return { erro: 'Não encontramos esta proposta.' };
  if (!TRANSICOES_STATUS[atual.data.status].includes(validacao.data.status)) {
    return { erro: 'Esse avanço não está disponível no estado atual da proposta.' };
  }

  const { data, error } = await supabase
    .from('propostas')
    .update({ status: validacao.data.status })
    .eq('id', validacao.data.id)
    .eq('status', atual.data.status)
    .select('versao, status, oportunidade_id, compartilhamento_codigo')
    .maybeSingle();

  if (error || !data) {
    console.error(`[propostas:status] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`);
    return { erro: 'Não foi possível atualizar agora. Tente novamente.' };
  }

  revalidatePath('/propostas');
  revalidatePath(`/propostas/${validacao.data.id}`);
  revalidatePath('/crm');
  revalidatePath(`/crm/${data.oportunidade_id}`);
  revalidarDirecaoOperacional();

  if (data.status === 'aceita') {
    const { data: projetoId, error: erroProjeto } = await supabase.rpc('projeto_iniciar', {
      p_proposta_id: validacao.data.id,
    });

    if (erroProjeto || !projetoId) {
      console.error(
        `[propostas:iniciar-projeto] ${erroProjeto?.code ?? 'sem-dados'}: ${erroProjeto?.message ?? ''}`,
      );
      return {
        sucesso: 'Venda confirmada. Abra a entrega pelo botão abaixo.',
        versao: data.versao,
        status: data.status,
        compartilhamentoCodigo: data.compartilhamento_codigo,
      };
    }

    revalidatePath('/entregas');
    redirect(`/entregas/${projetoId}`);
  }

  return {
    sucesso: 'Status atualizado.',
    versao: data.versao,
    status: data.status,
    compartilhamentoCodigo: data.compartilhamento_codigo,
  };
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  listarFormacoes,
  listarSolucoes,
  obterFormacao,
  obterSolucao,
} from '@/lib/conteudo/queries';
import { idsAulasProjeto, idsPassosProjeto } from '@/lib/projetos/roteiro';
import { createClient } from '@/lib/supabase/server';
import { mesclarProgresso, type EstadoProgressoConta } from './estado';
import { obterProgressoConta } from './queries';

const Slug = z
  .string()
  .min(3)
  .max(96)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const Id = z.uuid();
const ChaveEtapa = z.string().min(2).max(240);
const DataIso = z.iso.datetime({ offset: true });
const Registro = z.record(z.string().min(1).max(240), DataIso);
const EstadoImportacao = z
  .object({ aulas: Registro, formacoes: Registro, etapas: Registro, solucoes: Registro })
  .superRefine((estado, contexto) => {
    for (const [campo, registro] of Object.entries(estado)) {
      if (Object.keys(registro).length > 2_000) {
        contexto.addIssue({
          code: 'custom',
          path: [campo],
          message: 'Registro de progresso acima do limite.',
        });
      }
    }
  });

export type ResultadoProgresso = { ok: true } | { ok: false; mensagem: string };

const FALHA = 'Não foi possível salvar seu progresso agora.';

function registrarErro(contexto: string, erro: { code?: string; message?: string } | null) {
  if (erro) console.error(`[${contexto}] ${erro.code ?? 'sem-codigo'}: ${erro.message ?? ''}`);
}

async function sessao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidarProgresso() {
  revalidatePath('/inicio');
  revalidatePath('/certificados');
}

export async function tocarFormacaoConta(slugBruto: string): Promise<ResultadoProgresso> {
  const slug = Slug.safeParse(slugBruto);
  if (!slug.success) return { ok: false, mensagem: FALHA };

  const [{ supabase, user }, formacao] = await Promise.all([sessao(), obterFormacao(slug.data)]);
  if (!user) return { ok: false, mensagem: 'Sua sessão expirou. Entre novamente.' };
  if (!formacao) return { ok: false, mensagem: 'Esta formação não está mais disponível.' };

  const { error } = await supabase.from('progresso_formacoes').upsert(
    {
      dono: user.id,
      formacao_id: formacao.id,
      ultimo_acesso_em: new Date().toISOString(),
    },
    { onConflict: 'dono,formacao_id' },
  );

  if (error) {
    registrarErro('progresso:tocar-formacao', error);
    return { ok: false, mensagem: FALHA };
  }
  return { ok: true };
}

export async function concluirAulaConta(
  aulaIdBruto: string,
  slugBruto: string,
): Promise<ResultadoProgresso> {
  const entrada = z.object({ aulaId: Id, slug: Slug }).safeParse({
    aulaId: aulaIdBruto,
    slug: slugBruto,
  });
  if (!entrada.success) return { ok: false, mensagem: FALHA };

  const [{ supabase, user }, formacao] = await Promise.all([
    sessao(),
    obterFormacao(entrada.data.slug),
  ]);
  if (!user) return { ok: false, mensagem: 'Sua sessão expirou. Entre novamente.' };
  if (!formacao) return { ok: false, mensagem: 'Esta formação não está mais disponível.' };

  const aulasValidas = new Set(formacao.modulos.flatMap((modulo) => modulo.aulas.map((a) => a.id)));
  if (!aulasValidas.has(entrada.data.aulaId)) return { ok: false, mensagem: FALHA };

  const agora = new Date().toISOString();
  const [aula, toque] = await Promise.all([
    supabase.from('progresso_aulas').insert({
      dono: user.id,
      aula_id: entrada.data.aulaId,
      concluida_em: agora,
    }),
    supabase
      .from('progresso_formacoes')
      .upsert(
        { dono: user.id, formacao_id: formacao.id, ultimo_acesso_em: agora },
        { onConflict: 'dono,formacao_id' },
      ),
  ]);

  /* Concluir duas vezes é sucesso idempotente e não muda a data da conquista. */
  if (aula.error && aula.error.code !== '23505') {
    registrarErro('progresso:concluir-aula', aula.error);
    return { ok: false, mensagem: FALHA };
  }
  if (toque.error) {
    registrarErro('progresso:tocar-formacao-aula', toque.error);
    return { ok: false, mensagem: FALHA };
  }

  revalidarProgresso();
  return { ok: true };
}

export async function definirEtapaConta(
  etapaBruta: string,
  slugBruto: string,
  concluida: boolean,
): Promise<ResultadoProgresso> {
  const entrada = z
    .object({ etapa: ChaveEtapa, slug: Slug, concluida: z.boolean() })
    .safeParse({ etapa: etapaBruta, slug: slugBruto, concluida });
  if (!entrada.success) return { ok: false, mensagem: FALHA };

  const [{ supabase, user }, projeto] = await Promise.all([
    sessao(),
    obterSolucao(entrada.data.slug),
  ]);
  if (!user) return { ok: false, mensagem: 'Sua sessão expirou. Entre novamente.' };
  if (!projeto) return { ok: false, mensagem: 'Este projeto não está mais disponível.' };

  const chavesValidas = new Set(
    projeto.projeto
      ? [
          ...idsAulasProjeto(projeto.slug, projeto.projeto.roteiro),
          ...idsPassosProjeto(projeto.slug, projeto.projeto.roteiro),
        ]
      : projeto.itens.filter((item) => item.tipo === 'etapa').map((item) => item.id),
  );
  if (!chavesValidas.has(entrada.data.etapa)) return { ok: false, mensagem: FALHA };

  const agora = new Date().toISOString();
  const etapa = entrada.data.concluida
    ? await supabase.from('progresso_etapas').insert({
        dono: user.id,
        projeto_id: projeto.id,
        etapa_chave: entrada.data.etapa,
        concluida_em: agora,
      })
    : await supabase
        .from('progresso_etapas')
        .delete()
        .eq('dono', user.id)
        .eq('etapa_chave', entrada.data.etapa);
  const toque = await supabase
    .from('progresso_projetos')
    .upsert(
      { dono: user.id, projeto_id: projeto.id, ultimo_acesso_em: agora },
      { onConflict: 'dono,projeto_id' },
    );

  if (etapa.error && !(entrada.data.concluida && etapa.error.code === '23505')) {
    registrarErro('progresso:definir-etapa', etapa.error);
    return { ok: false, mensagem: FALHA };
  }
  if (toque.error) {
    registrarErro('progresso:tocar-projeto', toque.error);
    return { ok: false, mensagem: FALHA };
  }

  revalidarProgresso();
  return { ok: true };
}

/** Migração idempotente do `localStorage`: filtra tudo contra conteúdo publicado. */
export async function importarProgressoConta(bruto: unknown): Promise<ResultadoProgresso> {
  const leitura = EstadoImportacao.safeParse(bruto);
  if (!leitura.success) return { ok: false, mensagem: FALHA };

  const [{ supabase, user }, formacoes, projetos, atual] = await Promise.all([
    sessao(),
    listarFormacoes(),
    listarSolucoes(),
    obterProgressoConta(),
  ]);
  if (!user) return { ok: false, mensagem: 'Sua sessão expirou. Entre novamente.' };

  const formacaoPorSlug = new Map(formacoes.map((item) => [item.slug, item]));
  const aulaValida = new Set(formacoes.flatMap((item) => item.aulaIds));
  const projetoPorSlug = new Map(projetos.map((item) => [item.slug, item]));
  const projetoPorEtapa = new Map(
    projetos.flatMap((item) => {
      const aulas = item.projeto ? idsAulasProjeto(item.slug, item.projeto.roteiro) : [];
      return [...item.etapaIds, ...aulas].map((etapa) => [etapa, item] as const);
    }),
  );
  const filtrado: EstadoProgressoConta = {
    aulas: Object.fromEntries(
      Object.entries(leitura.data.aulas).filter(([id]) => aulaValida.has(id)),
    ),
    formacoes: Object.fromEntries(
      Object.entries(leitura.data.formacoes).filter(([slug]) => formacaoPorSlug.has(slug)),
    ),
    etapas: Object.fromEntries(
      Object.entries(leitura.data.etapas).filter(([id]) => projetoPorEtapa.has(id)),
    ),
    solucoes: Object.fromEntries(
      Object.entries(leitura.data.solucoes).filter(([slug]) => projetoPorSlug.has(slug)),
    ),
  };
  const final = mesclarProgresso(atual, filtrado);

  const operacoes: Array<PromiseLike<{ error: { code?: string; message?: string } | null }>> = [];
  const aulas = Object.entries(final.aulas).map(([aula_id, concluida_em]) => ({
    dono: user.id,
    aula_id,
    concluida_em,
  }));
  const toquesFormacao = Object.entries(final.formacoes).flatMap(([slug, ultimo_acesso_em]) => {
    const item = formacaoPorSlug.get(slug);
    return item ? [{ dono: user.id, formacao_id: item.id, ultimo_acesso_em }] : [];
  });
  const etapas = Object.entries(final.etapas).flatMap(([etapa_chave, concluida_em]) => {
    const item = projetoPorEtapa.get(etapa_chave);
    return item ? [{ dono: user.id, projeto_id: item.id, etapa_chave, concluida_em }] : [];
  });
  const toquesProjeto = Object.entries(final.solucoes).flatMap(([slug, ultimo_acesso_em]) => {
    const item = projetoPorSlug.get(slug);
    return item ? [{ dono: user.id, projeto_id: item.id, ultimo_acesso_em }] : [];
  });

  if (aulas.length)
    operacoes.push(supabase.from('progresso_aulas').upsert(aulas, { onConflict: 'dono,aula_id' }));
  if (toquesFormacao.length)
    operacoes.push(
      supabase
        .from('progresso_formacoes')
        .upsert(toquesFormacao, { onConflict: 'dono,formacao_id' }),
    );
  if (etapas.length)
    operacoes.push(
      supabase.from('progresso_etapas').upsert(etapas, { onConflict: 'dono,etapa_chave' }),
    );
  if (toquesProjeto.length)
    operacoes.push(
      supabase.from('progresso_projetos').upsert(toquesProjeto, { onConflict: 'dono,projeto_id' }),
    );

  const resultados = await Promise.all(operacoes);
  const falha = resultados.find((resultado) => resultado.error)?.error ?? null;
  if (falha) {
    registrarErro('progresso:importar-legado', falha);
    return { ok: false, mensagem: FALHA };
  }

  revalidarProgresso();
  return { ok: true };
}

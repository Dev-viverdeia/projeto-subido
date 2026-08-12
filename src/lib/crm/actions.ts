'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ETAPAS_CRM } from './etapas';

const criarLeadSchema = z.object({
  empresa: z.string().trim().min(1, 'Digite o nome da empresa.').max(160, 'Nome muito longo.'),
  contato: z.string().trim().min(1, 'Digite o nome do contato.').max(160, 'Nome muito longo.'),
  email: z
    .string()
    .trim()
    .max(320, 'E-mail muito longo.')
    .refine((valor) => !valor || z.email().safeParse(valor).success, 'Digite um e-mail válido.'),
  titulo: z.string().trim().max(180, 'Título muito longo.'),
});

const moverSchema = z.object({
  id: z.uuid(),
  etapa: z.enum(ETAPAS_CRM.map((etapa) => etapa.id) as [string, ...string[]]),
});

const aplicarAcaoSchema = z.object({
  oportunidade: z.uuid(),
  enriquecimento: z.uuid(),
});

export type EstadoNovoLead = {
  erro?: string;
  porCampo?: Partial<Record<'empresa' | 'contato' | 'email' | 'titulo', string>>;
  campos?: Partial<Record<'empresa' | 'contato' | 'email' | 'titulo', string>>;
};

function camposDo(formData: FormData) {
  const texto = (nome: string) => {
    const valor = formData.get(nome);
    return typeof valor === 'string' ? valor : '';
  };

  return {
    empresa: texto('empresa'),
    contato: texto('contato'),
    email: texto('email'),
    titulo: texto('titulo'),
  };
}

export async function criarLead(
  _estado: EstadoNovoLead,
  formData: FormData,
): Promise<EstadoNovoLead> {
  const campos = camposDo(formData);
  const validacao = criarLeadSchema.safeParse(campos);

  if (!validacao.success) {
    const erros = z.flattenError(validacao.error).fieldErrors;
    return {
      campos,
      porCampo: {
        empresa: erros.empresa?.[0],
        contato: erros.contato?.[0],
        email: erros.email?.[0],
        titulo: erros.titulo?.[0],
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { campos, erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const { data, error } = await supabase.rpc('crm_criar_lead', {
    p_empresa_nome: validacao.data.empresa,
    p_contato_nome: validacao.data.contato,
    p_contato_email: validacao.data.email || undefined,
    p_oportunidade_titulo: validacao.data.titulo || undefined,
  });

  if (error) {
    console.error(`[crm:criar-lead] ${error.code}: ${error.message}`);
    return {
      campos,
      erro: 'Não foi possível adicionar o lead agora. Tente de novo em instantes.',
    };
  }

  const oportunidade = z.uuid().safeParse(data);
  if (!oportunidade.success) {
    console.error('[crm:criar-lead] A oportunidade foi criada sem um identificador válido.');
    return {
      campos,
      erro: 'O lead foi criado, mas não conseguimos abrir a próxima etapa. Atualize o CRM.',
    };
  }

  revalidatePath('/crm');
  revalidatePath('/inicio');
  redirect(`/crm/${oportunidade.data}?novo=1`);
}

export async function moverOportunidade(formData: FormData): Promise<void> {
  const validacao = moverSchema.safeParse({
    id: formData.get('id'),
    etapa: formData.get('etapa'),
  });
  if (!validacao.success) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc('crm_mover_oportunidade', {
    p_oportunidade: validacao.data.id,
    p_etapa: validacao.data.etapa as (typeof ETAPAS_CRM)[number]['id'],
  });

  if (error) {
    console.error(`[crm:mover] ${error.code}: ${error.message}`);
    return;
  }

  revalidatePath('/crm');
  revalidatePath('/inicio');
}

export async function aplicarProximaAcao(formData: FormData): Promise<void> {
  const validacao = aplicarAcaoSchema.safeParse({
    oportunidade: formData.get('oportunidade'),
    enriquecimento: formData.get('enriquecimento'),
  });
  if (!validacao.success) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc('crm_aplicar_proxima_acao', {
    p_oportunidade: validacao.data.oportunidade,
    p_enriquecimento: validacao.data.enriquecimento,
  });
  if (error) {
    console.error(`[crm:aplicar-acao] ${error.code}: ${error.message}`);
    return;
  }

  revalidatePath('/crm');
  revalidatePath(`/crm/${validacao.data.oportunidade}`);
  revalidatePath('/solucoes');
  revalidatePath('/inicio');
}

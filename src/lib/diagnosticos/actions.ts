'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { CANAIS_DIAGNOSTICO } from './schema';

const NovoDiagnosticoSchema = z
  .object({
    oportunidade: z.uuid(),
    canal: z.enum(CANAIS_DIAGNOSTICO),
    site: z.string().trim().max(1000),
    cenario: z.string().trim().min(20).max(4000),
    evidencia: z.string().trim().max(50000),
    autorizacao: z.boolean(),
  })
  .refine((valor) => Boolean(valor.site || valor.evidencia), {
    message: 'Informe o site ou uma conversa autorizada.',
  })
  .refine((valor) => !valor.evidencia || valor.autorizacao, {
    message: 'Confirme a autorização para usar a conversa.',
    path: ['autorizacao'],
  });

export async function criarDiagnostico(formData: FormData): Promise<void> {
  const leitura = NovoDiagnosticoSchema.safeParse({
    oportunidade: formData.get('oportunidade'),
    canal: formData.get('canal'),
    site: formData.get('site') ?? '',
    cenario: formData.get('cenario'),
    evidencia: formData.get('evidencia') ?? '',
    autorizacao: formData.get('autorizacao') === 'on',
  });
  if (!leitura.success) {
    const autorizacao = leitura.error.issues.some((item) => item.path.includes('autorizacao'));
    redirect(`/diagnosticos/novo?erro=${autorizacao ? 'autorizacao' : 'campos'}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  const { data, error } = await supabase.rpc('diagnostico_iniciar', {
    p_oportunidade: leitura.data.oportunidade,
    p_canal: leitura.data.canal,
    p_site_url: leitura.data.site,
    p_cenario: leitura.data.cenario,
    p_evidencia: leitura.data.evidencia || undefined,
    p_confirmou_autorizacao: leitura.data.autorizacao,
  });

  if (error || !data) {
    console.error(`[diagnosticos:criar] ${error?.code ?? 'sem-dados'}: ${error?.message ?? ''}`);
    const codigo = error?.code === '55000' ? 'andamento' : 'salvar';
    redirect(`/diagnosticos/novo?erro=${codigo}`);
  }

  revalidatePath('/diagnosticos');
  redirect(`/diagnosticos/${data}?executar=1`);
}

export async function aplicarAcaoDoDiagnostico(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get('diagnostico'));
  if (!id.success) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc('diagnostico_aplicar_proxima_acao', {
    p_diagnostico: id.data,
  });
  if (error) {
    console.error(`[diagnosticos:aplicar-acao] ${error.code}: ${error.message}`);
    return;
  }

  revalidatePath(`/diagnosticos/${id.data}`);
  revalidatePath('/crm');
  revalidatePath('/inicio');
}

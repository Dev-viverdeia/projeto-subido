'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PerfilComercialFormularioSchema, vazioParaNulo } from './schema';

export type EstadoPerfilComercial = {
  erro?: string;
  sucesso?: string;
  porCampo?: Partial<Record<string, string>>;
};

export async function salvarPerfilComercial(
  _estado: EstadoPerfilComercial,
  formData: FormData,
): Promise<EstadoPerfilComercial> {
  const validacao = PerfilComercialFormularioSchema.safeParse({
    nomeResponsavel: formData.get('nomeResponsavel'),
    nomeNegocio: formData.get('nomeNegocio') ?? '',
    email: formData.get('email') ?? '',
    telefone: formData.get('telefone') ?? '',
    site: formData.get('site') ?? '',
    logoPath: formData.get('logoPath') ?? '',
    linkPagamentoPadrao: formData.get('linkPagamentoPadrao') ?? '',
  });

  if (!validacao.success) {
    const erros = validacao.error.flatten().fieldErrors;
    return {
      erro: 'Revise os dados destacados antes de salvar.',
      porCampo: Object.fromEntries(
        Object.entries(erros).map(([campo, mensagens]) => [
          campo,
          mensagens?.[0] ?? 'Revise este campo.',
        ]),
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: 'Sua sessão expirou. Entre novamente para continuar.' };

  const dados = validacao.data;
  const anterior = await supabase
    .from('perfis_comerciais')
    .select('logo_path')
    .eq('dono', user.id)
    .maybeSingle();
  const { error } = await supabase.from('perfis_comerciais').upsert(
    {
      dono: user.id,
      nome_responsavel: dados.nomeResponsavel,
      nome_negocio: vazioParaNulo(dados.nomeNegocio),
      email: vazioParaNulo(dados.email),
      telefone: vazioParaNulo(dados.telefone),
      site: vazioParaNulo(dados.site),
      logo_path: vazioParaNulo(dados.logoPath),
      link_pagamento_padrao: vazioParaNulo(dados.linkPagamentoPadrao),
    },
    { onConflict: 'dono' },
  );

  if (error) {
    console.error(`[perfil-comercial:salvar] ${error.code}: ${error.message}`);
    return { erro: 'Não foi possível salvar agora. Tente novamente em instantes.' };
  }

  const logoAnterior = anterior.data?.logo_path;
  const logoAtual = vazioParaNulo(dados.logoPath);
  if (logoAnterior && logoAnterior !== logoAtual) {
    const remocao = await supabase.storage.from('identidade-comercial').remove([logoAnterior]);
    if (remocao.error) {
      console.error(`[perfil-comercial:limpar-logo] ${remocao.error.message}`);
    }
  }

  revalidatePath('/conta');
  return { sucesso: 'Identidade comercial salva. As próximas propostas já usarão estes dados.' };
}

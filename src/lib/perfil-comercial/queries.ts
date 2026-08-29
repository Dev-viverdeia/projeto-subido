import 'server-only';

import { cache } from 'react';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types.generated';
import type { PerfilComercial } from './schema';

const BUCKET = 'identidade-comercial';

type LinhaPerfil = Tables<'perfis_comerciais'>;

function montarPerfil(linha: LinhaPerfil, logoUrl: string | null): PerfilComercial {
  return {
    nomeResponsavel: linha.nome_responsavel,
    nomeNegocio: linha.nome_negocio,
    email: linha.email,
    telefone: linha.telefone,
    site: linha.site,
    logoPath: linha.logo_path,
    logoUrl,
    linkPagamentoPadrao: linha.link_pagamento_padrao,
  };
}

export const obterPerfilComercial = cache(async (): Promise<PerfilComercial | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('perfis_comerciais').select('*').maybeSingle();

  if (error) throw handleError(error, 'perfil-comercial:obter');
  if (!data) return null;

  const logoUrl = data.logo_path
    ? supabase.storage.from(BUCKET).getPublicUrl(data.logo_path).data.publicUrl
    : null;
  return montarPerfil(data, logoUrl);
});

export function perfilComercialInicial({
  perfil,
  nome,
  email,
}: {
  perfil: PerfilComercial | null;
  nome: string;
  email: string;
}): PerfilComercial {
  return (
    perfil ?? {
      nomeResponsavel: nome === '—' ? '' : nome,
      nomeNegocio: null,
      email: email === '—' ? null : email,
      telefone: null,
      site: null,
      logoPath: null,
      logoUrl: null,
      linkPagamentoPadrao: null,
    }
  );
}

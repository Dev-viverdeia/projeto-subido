'use server';

import { z } from 'zod';
// Módulo server-only: emissão verificada é uma escrita do sistema, nunca do cliente.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { obterProgressoConta } from '@/lib/progresso/queries';
import { carregarCertificavel, type OrigemCertificado } from './conteudo';

const Origem = z.enum(['formacao', 'solucao']);
const Slug = z
  .string()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9-]+$/);

export type ResultadoEmissao = { ok: true; codigo: string } | { ok: false; mensagem: string };

export async function emitirCertificado(
  origemBruta: OrigemCertificado,
  slugBruto: string,
): Promise<ResultadoEmissao> {
  const origem = Origem.safeParse(origemBruta);
  const slug = Slug.safeParse(slugBruto);
  if (!origem.success || !slug.success) {
    return { ok: false, mensagem: 'Não foi possível identificar este certificado.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensagem: 'Sua sessão expirou. Entre novamente.' };

  const [conteudo, progresso] = await Promise.all([
    carregarCertificavel(origem.data, slug.data),
    obterProgressoConta(),
  ]);
  if (!conteudo || conteudo.itemIds.length === 0) {
    return { ok: false, mensagem: 'Este conteúdo não está disponível para certificação.' };
  }

  const registro = origem.data === 'formacao' ? progresso.aulas : progresso.etapas;
  const datas = conteudo.itemIds
    .map((id) => registro[id])
    .filter((data): data is string => Boolean(data));
  if (datas.length < conteudo.itemIds.length) {
    return { ok: false, mensagem: 'Conclua todas as etapas antes de emitir o certificado.' };
  }

  const metadataBruta: unknown = user.user_metadata;
  const metadata = z.object({ nome: z.string().optional() }).passthrough().safeParse(metadataBruta);
  const nomeMetadata = metadata.success ? metadata.data.nome : undefined;
  const nome =
    typeof nomeMetadata === 'string' && nomeMetadata.trim() ? nomeMetadata.trim() : user.email;
  if (!nome) return { ok: false, mensagem: 'Adicione seu nome na conta antes de emitir.' };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('certificados_emitidos')
    .upsert(
      {
        dono: user.id,
        origem: origem.data,
        slug: slug.data,
        titulo: conteudo.titulo,
        nome,
        concluido_em: datas.sort().at(-1)!,
      },
      { onConflict: 'dono,origem,slug' },
    )
    .select('codigo')
    .single();

  if (error || !data) {
    return { ok: false, mensagem: 'Não foi possível gerar o link agora. Tente novamente.' };
  }
  return { ok: true, codigo: data.codigo };
}

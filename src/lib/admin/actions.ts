'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ehAdmin } from '@/lib/auth/papeis';
import { PACOTES_CREDITOS, planoDosMetadados } from '@/lib/planos/acessos';
// eslint-disable-next-line no-restricted-imports -- Server Action protegida por ehAdmin
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type EstadoAdminAcesso = {
  status: 'inicial' | 'sucesso' | 'erro';
  mensagem?: string;
  plano?: 'starter' | 'pro';
  saldo?: number;
};

export const ESTADO_ADMIN_ACESSO: EstadoAdminAcesso = { status: 'inicial' };

const planoSchema = z.object({
  usuario: z.uuid(),
  plano: z.enum(['starter', 'pro']),
});

const pacoteSchema = z.object({
  usuario: z.uuid(),
  pacote: z.enum(PACOTES_CREDITOS.map((pacote) => pacote.id)),
});

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === 'string' ? valor : '';
}

async function contextoAdmin() {
  if (!(await ehAdmin())) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

function revalidarAdministracao() {
  revalidatePath('/admin');
  revalidatePath('/admin/acessos');
  revalidatePath('/conta');
}

/** Troca o plano no app_metadata assinado e registra quem fez a mudança. */
export async function alterarPlanoAdmin(
  _anterior: EstadoAdminAcesso,
  formData: FormData,
): Promise<EstadoAdminAcesso> {
  const parsed = planoSchema.safeParse({
    usuario: texto(formData.get('usuario')),
    plano: texto(formData.get('plano')),
  });

  if (!parsed.success) {
    return { status: 'erro', mensagem: 'Escolha um plano válido e tente novamente.' };
  }

  const adminId = await contextoAdmin();
  if (!adminId) return { status: 'erro', mensagem: 'Sua sessão não permite esta alteração.' };

  const admin = createAdminClient();
  const { data: atual, error: erroLeitura } = await admin.auth.admin.getUserById(
    parsed.data.usuario,
  );

  if (erroLeitura || !atual.user) {
    console.error('[admin:plano:leitura]', erroLeitura?.code, erroLeitura?.message);
    return {
      status: 'erro',
      mensagem: 'Não encontramos essa conta. Atualize a tela e tente de novo.',
    };
  }

  const metadataAnterior = atual.user.app_metadata ?? {};
  const planoAnterior = planoDosMetadados(metadataAnterior);
  if (planoAnterior === parsed.data.plano) {
    return {
      status: 'sucesso',
      plano: parsed.data.plano,
      mensagem: `A conta já está no plano ${parsed.data.plano === 'pro' ? 'Pro' : 'Starter'}.`,
    };
  }

  const { error: erroAtualizacao } = await admin.auth.admin.updateUserById(parsed.data.usuario, {
    app_metadata: { ...metadataAnterior, plano_subido: parsed.data.plano },
  });

  if (erroAtualizacao) {
    console.error('[admin:plano:atualizar]', erroAtualizacao.code, erroAtualizacao.message);
    return { status: 'erro', mensagem: 'O plano não foi alterado. Tente novamente em instantes.' };
  }

  const { error: erroHistorico } = await admin.from('admin_acessos_eventos').insert({
    admin_id: adminId,
    usuario_id: parsed.data.usuario,
    tipo: 'plano_alterado',
    plano_anterior: planoAnterior,
    plano_novo: parsed.data.plano,
  });

  if (erroHistorico) {
    console.error('[admin:plano:historico]', erroHistorico.code, erroHistorico.message);
    const { error: erroReversao } = await admin.auth.admin.updateUserById(parsed.data.usuario, {
      app_metadata: metadataAnterior,
    });
    if (erroReversao) {
      console.error('[admin:plano:reversao]', erroReversao.code, erroReversao.message);
    }
    return {
      status: 'erro',
      mensagem: 'A alteração não foi concluída e o plano anterior foi preservado.',
    };
  }

  revalidarAdministracao();
  return {
    status: 'sucesso',
    plano: parsed.data.plano,
    mensagem: `Plano ${parsed.data.plano === 'pro' ? 'Pro' : 'Starter'} aplicado à conta.`,
  };
}

/** Concede somente os pacotes fixos do produto; quantidade avulsa não entra aqui. */
export async function concederPacoteAdmin(
  _anterior: EstadoAdminAcesso,
  formData: FormData,
): Promise<EstadoAdminAcesso> {
  const parsed = pacoteSchema.safeParse({
    usuario: texto(formData.get('usuario')),
    pacote: texto(formData.get('pacote')),
  });

  if (!parsed.success) {
    return { status: 'erro', mensagem: 'Escolha um pacote válido e tente novamente.' };
  }

  const adminId = await contextoAdmin();
  if (!adminId) return { status: 'erro', mensagem: 'Sua sessão não permite esta alteração.' };

  const admin = createAdminClient();
  const { data: saldo, error } = await admin.rpc('admin_sistema_conceder_pacote', {
    p_admin: adminId,
    p_usuario: parsed.data.usuario,
    p_pacote: parsed.data.pacote,
    p_referencia: `admin-pacote:${crypto.randomUUID()}`,
  });

  if (error) {
    console.error('[admin:creditos:pacote]', error.code, error.message);
    return { status: 'erro', mensagem: 'Os créditos não foram adicionados. Tente novamente.' };
  }

  revalidarAdministracao();
  return {
    status: 'sucesso',
    saldo,
    mensagem: `Pacote adicionado. O novo saldo é de ${saldo} créditos.`,
  };
}

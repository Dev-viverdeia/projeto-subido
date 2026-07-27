'use server';

import { redirect } from 'next/navigation';
import type { ZodError } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { destinoSeguro, ROTA_CALLBACK, ROTA_ENTRAR, ROTA_NOVA_SENHA } from '@/lib/routes';
import { criarContaSchema, entrarSchema, novaSenhaSchema, recuperarSenhaSchema } from './schemas';

/**
 * Estado devolvido a `useActionState`.
 *
 * `campos` guarda o que a pessoa digitou para repopular o formulário: sem isso, um
 * erro de senha apaga também o e-mail já preenchido — e a senha nunca volta, de
 * propósito.
 */
export type EstadoAuth = {
  erro?: string;
  porCampo?: Record<string, string>;
  campos?: Record<string, string>;
  sucesso?: string;
};

/**
 * Lê um campo de formulário como texto.
 *
 * `FormData.get()` devolve `string | File`, e um `String(file)` produz a string
 * literal `"[object File]"` — que tem 15 caracteres e passaria por um
 * `.min(8)` de senha sem piscar. Não é hipótese: quem posta o multipart na mão
 * escolhe o tipo de cada parte. Campo que não é texto vira vazio e cai na
 * validação, que é o comportamento correto.
 */
function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === 'string' ? valor : '';
}

function deZod(erro: ZodError, campos: Record<string, string>): EstadoAuth {
  const porCampo: Record<string, string> = {};
  for (const issue of erro.issues) {
    const chave = issue.path[0];
    if (typeof chave === 'string' && !porCampo[chave]) porCampo[chave] = issue.message;
  }
  return { porCampo, campos };
}

/**
 * Mensagem única para credencial inválida.
 *
 * O Supabase devolve `Invalid login credentials` tanto para e-mail inexistente
 * quanto para senha errada, e está certo: distinguir os dois transforma a tela de
 * login num oráculo de "esse e-mail tem conta aqui" — que é enumeração de usuários.
 * Repetimos a mesma frase para os dois casos aqui de propósito.
 */
const CREDENCIAL_INVALIDA = 'E-mail ou senha incorretos.';

export async function entrar(_anterior: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const bruto = {
    email: texto(formData.get('email')),
    senha: texto(formData.get('senha')),
  };
  const campos = { email: bruto.email };

  const parsed = entrarSchema.safeParse(bruto);
  if (!parsed.success) return deZod(parsed.error, campos);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });

  if (error) {
    console.error('[auth:entrar]', error.code, error.message);
    return {
      erro:
        error.code === 'email_not_confirmed'
          ? 'Confirme seu e-mail antes de entrar.'
          : CREDENCIAL_INVALIDA,
      campos,
    };
  }

  /* Fora de try/catch: redirect() sinaliza por exceção, e um catch a engoliria —
     a navegação simplesmente não aconteceria, sem erro nenhum. */
  redirect(destinoSeguro(texto(formData.get('proximo'))));
}

export async function criarConta(_anterior: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const bruto = {
    nome: texto(formData.get('nome')),
    email: texto(formData.get('email')),
    senha: texto(formData.get('senha')),
  };
  const campos = { nome: bruto.nome, email: bruto.email };

  const parsed = criarContaSchema.safeParse(bruto);
  if (!parsed.success) return deZod(parsed.error, campos);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.senha,
    options: {
      data: { nome: parsed.data.nome },
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}${ROTA_CALLBACK}`,
    },
  });

  if (error) {
    console.error('[auth:criar-conta]', error.code, error.message);
    return {
      erro:
        error.code === 'weak_password'
          ? 'Essa senha é fraca demais. Escolha outra.'
          : 'Não foi possível criar a conta. Tente de novo em instantes.',
      campos,
    };
  }

  /**
   * Confirmação sempre anunciada, mesmo quando o e-mail já tem conta.
   *
   * O Supabase não erra nesse caso — devolve sucesso e não envia nada, justamente
   * para não revelar que o endereço existe. Nossa mensagem acompanha esse desenho:
   * dizer "esse e-mail já está cadastrado" aqui reabriria a enumeração que o
   * `signInWithPassword` fecha.
   */
  return {
    sucesso: `Enviamos um link de confirmação para ${parsed.data.email}. Abra o e-mail para ativar a conta.`,
  };
}

export async function recuperarSenha(
  _anterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const bruto = { email: texto(formData.get('email')) };

  const parsed = recuperarSenhaSchema.safeParse(bruto);
  if (!parsed.success) return deZod(parsed.error, bruto);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}${ROTA_CALLBACK}?proximo=${ROTA_NOVA_SENHA}`,
  });

  if (error) console.error('[auth:recuperar-senha]', error.code, error.message);

  /* Resposta idêntica com ou sem erro — mesma razão de sempre: a diferença entre
     "enviado" e "e-mail não cadastrado" é um oráculo de contas existentes. */
  return {
    sucesso: 'Se existir uma conta com esse e-mail, o link de redefinição chega em instantes.',
  };
}

export async function definirNovaSenha(
  _anterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const bruto = {
    senha: texto(formData.get('senha')),
    confirmacao: texto(formData.get('confirmacao')),
  };

  const parsed = novaSenhaSchema.safeParse(bruto);
  if (!parsed.success) return deZod(parsed.error, {});

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });

  if (error) {
    console.error('[auth:nova-senha]', error.code, error.message);
    return { erro: 'Não foi possível trocar a senha. Peça um link novo e tente de novo.' };
  }

  redirect(destinoSeguro(null));
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROTA_ENTRAR);
}

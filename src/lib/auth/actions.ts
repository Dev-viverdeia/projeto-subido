'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ZodError } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import {
  destinoSeguro,
  ROTA_BOAS_VINDAS,
  ROTA_CALLBACK,
  ROTA_ENTRAR,
  ROTA_NOVA_SENHA,
} from '@/lib/routes';
import {
  atualizarIdentidadeSchema,
  criarContaSchema,
  entrarSchema,
  novaSenhaSchema,
  recuperarSenhaSchema,
} from './schemas';

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
  emailPendente?: string;
  confirmacaoPendente?: boolean;
};

export type EstadoIdentidade = {
  erro?: string;
  porCampo?: { nome?: string };
  campos?: { nome?: string };
  sucesso?: string;
  nome?: string;
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
      emailPendente: error.code === 'email_not_confirmed' ? parsed.data.email : undefined,
      confirmacaoPendente: error.code === 'email_not_confirmed' || undefined,
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
    sucesso:
      'Confira sua caixa de entrada. Se este e-mail ainda não tinha uma conta, enviamos o link para ativá-la.',
    emailPendente: parsed.data.email,
    confirmacaoPendente: true,
  };
}

/**
 * Solicita um novo e-mail de confirmação sem revelar se o endereço está cadastrado.
 *
 * O Supabase diferencia internamente uma conta confirmada, inexistente ou ainda
 * pendente. A tela não pode transformar essa diferença em enumeração de usuários;
 * por isso, a resposta pública continua igual em todos os casos.
 */
export async function reenviarConfirmacao(
  _anterior: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const bruto = { email: texto(formData.get('email')) };
  const parsed = recuperarSenhaSchema.safeParse(bruto);

  if (!parsed.success) return deZod(parsed.error, bruto);

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: parsed.data.email,
    options: { emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}${ROTA_CALLBACK}` },
  });

  if (error) console.error('[auth:reenviar-confirmacao]', error.code, error.message);

  return {
    sucesso:
      'Se a confirmação ainda estava pendente, um novo link foi enviado. Ele pode levar alguns instantes para chegar.',
    emailPendente: parsed.data.email,
    confirmacaoPendente: true,
  };
}

/**
 * Inicia o OAuth social. O Google autentica apenas identidade básica aqui;
 * Calendar continua sendo uma integração separada e opcional dentro da conta.
 */
export async function entrarComGoogle(formData: FormData): Promise<never> {
  const proximo = destinoSeguro(texto(formData.get('proximo')) || ROTA_BOAS_VINDAS);
  const callback = new URL(ROTA_CALLBACK, env.NEXT_PUBLIC_SITE_URL);
  callback.searchParams.set('proximo', proximo);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callback.toString(),
      scopes: 'openid email profile',
    },
  });

  if (error || !data.url) {
    console.error('[auth:google]', error?.code, error?.message);
    redirect(`${ROTA_ENTRAR}?erro=google`);
  }

  redirect(data.url);
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

/**
 * Atualiza o nome que identifica a pessoa em TODO o shell autenticado.
 *
 * A action autentica de novo porque Server Actions são endpoints POST públicos:
 * renderizar o formulário atrás do layout não autoriza a mutação. Depois do
 * `updateUser`, a sessão é renovada para que o JWT carregue o novo metadata — sem
 * isso `/conta` mudaria, mas o nome do cabeçalho continuaria antigo até o token
 * expirar.
 */
export async function atualizarIdentidade(
  _anterior: EstadoIdentidade,
  formData: FormData,
): Promise<EstadoIdentidade> {
  const bruto = { nome: texto(formData.get('nome')) };
  const validacao = atualizarIdentidadeSchema.safeParse(bruto);

  if (!validacao.success) {
    return {
      porCampo: { nome: validacao.error.issues[0]?.message ?? 'Revise seu nome.' },
      campos: bruto,
    };
  }

  const supabase = await createClient();
  const { data: sessao, error: erroSessao } = await supabase.auth.getClaims();

  if (erroSessao || !sessao?.claims?.sub) {
    if (erroSessao) console.error('[auth:atualizar-identidade:sessao]', erroSessao.message);
    return { erro: 'Sua sessão expirou. Entre novamente para alterar o nome.', campos: bruto };
  }

  const nomeAtual =
    typeof sessao.claims.user_metadata?.nome === 'string'
      ? sessao.claims.user_metadata.nome.trim()
      : '';

  if (nomeAtual === validacao.data.nome) {
    return {
      sucesso: 'Seu nome já está atualizado em toda a plataforma.',
      nome: validacao.data.nome,
    };
  }

  const { error } = await supabase.auth.updateUser({ data: { nome: validacao.data.nome } });

  if (error) {
    console.error('[auth:atualizar-identidade]', error.code, error.message);
    return {
      erro: 'Não foi possível salvar seu nome agora. Tente novamente em instantes.',
      campos: bruto,
    };
  }

  /* `updateUser` troca `session.user`, mas o layout lê os claims do access token.
     Renovar a sessão reemite esse token e o `setAll` do cliente SSR grava os
     cookies dentro da própria Server Action. */
  const { error: erroRenovacao } = await supabase.auth.refreshSession();
  if (erroRenovacao) {
    console.error(
      '[auth:atualizar-identidade:renovar-sessao]',
      erroRenovacao.code,
      erroRenovacao.message,
    );
    return {
      erro: 'O nome foi salvo, mas a tela não conseguiu sincronizar. Atualize a página.',
      nome: validacao.data.nome,
    };
  }

  refresh();
  return {
    sucesso: 'Nome atualizado em toda a plataforma.',
    nome: validacao.data.nome,
  };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROTA_ENTRAR);
}

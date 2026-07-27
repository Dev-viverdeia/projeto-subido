import { z } from 'zod';

/**
 * Validação compartilhada entre as Server Actions.
 *
 * Fica num módulo sem `'use server'` de propósito: um arquivo marcado como server
 * action só pode exportar funções assíncronas — exportar um schema de lá é erro de
 * build, com uma mensagem que não explica isso.
 */

export const emailSchema = z
  .email({ error: 'Digite um e-mail válido.' })
  .transform((v) => v.trim().toLowerCase());

/**
 * Oito caracteres, sem exigência de símbolo.
 *
 * A regra de "1 maiúscula, 1 número, 1 símbolo" produz `Senha123!` — previsível
 * para quem ataca e irritante para quem usa. O NIST recomenda comprimento mínimo e
 * bloqueio de senhas vazadas, não composição obrigatória. O bloqueio de vazadas é
 * config do Supabase (Auth → Password Security), não código daqui.
 */
export const senhaSchema = z
  .string()
  .min(8, { error: 'A senha precisa de ao menos 8 caracteres.' });

export const entrarSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, { error: 'Digite sua senha.' }),
});

export const criarContaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, { error: 'Digite seu nome.' })
    .max(80, { error: 'Nome muito longo.' }),
  email: emailSchema,
  senha: senhaSchema,
});

export const recuperarSenhaSchema = z.object({ email: emailSchema });

export const novaSenhaSchema = z
  .object({
    senha: senhaSchema,
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    error: 'As duas senhas não são iguais.',
    path: ['confirmacao'],
  });

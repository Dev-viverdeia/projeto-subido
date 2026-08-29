import { z } from 'zod';

const UrlHttp = z
  .string()
  .trim()
  .max(1000)
  .refine((valor) => {
    if (!valor) return true;
    try {
      const url = new URL(valor);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }, 'Use um link completo, começando com https://');

export const PerfilComercialFormularioSchema = z.object({
  nomeResponsavel: z.string().trim().min(2).max(120),
  nomeNegocio: z.string().trim().max(160),
  email: z.union([z.literal(''), z.email().max(254)]),
  telefone: z.string().trim().max(40),
  site: UrlHttp,
  logoPath: z.string().trim().max(500),
  linkPagamentoPadrao: UrlHttp,
});

export type PerfilComercial = {
  nomeResponsavel: string;
  nomeNegocio: string | null;
  email: string | null;
  telefone: string | null;
  site: string | null;
  logoPath: string | null;
  logoUrl: string | null;
  linkPagamentoPadrao: string | null;
};

export type PerfilComercialFormulario = z.infer<typeof PerfilComercialFormularioSchema>;

export function vazioParaNulo(valor: string): string | null {
  const limpo = valor.trim();
  return limpo || null;
}

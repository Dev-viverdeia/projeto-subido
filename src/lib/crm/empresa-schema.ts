import { z } from 'zod';

/** Guarda somente o domínio público, sem credenciais, caminhos ou rastreadores. */
export function dominioEmpresa(valor: string): string | null {
  const texto = valor.trim();
  if (!texto) return '';
  if (
    /\s|\\/.test(texto) ||
    texto.startsWith('//') ||
    [...texto].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)
  )
    return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(texto) && !/^https?:\/\//i.test(texto)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (url.username || url.password || url.port || !['http:', 'https:'].includes(url.protocol))
      return null;
    if (
      host.length > 253 ||
      !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid|example|lan|home|onion)$/.test(host)
    )
      return null;
    return host;
  } catch {
    return null;
  }
}

export const empresaFichaSchema = z.object({
  oportunidade: z.uuid(),
  empresaId: z.uuid(),
  revisao: z.number().int().nonnegative(),
  nome: z
    .string()
    .trim()
    .min(1, 'Digite o nome da empresa.')
    .max(160, 'Use até 160 caracteres.')
    .refine(
      (valor) => ![...valor].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127),
      'Remova as quebras de linha deste campo.',
    ),
  site: z
    .string()
    .trim()
    .max(2048, 'Use um endereço mais curto.')
    .refine(
      (valor) => dominioEmpresa(valor) !== null,
      'Digite um site público, como empresa.com.br.',
    )
    .transform((valor) => dominioEmpresa(valor)!),
});

export type EntradaEmpresaFicha = z.input<typeof empresaFichaSchema>;
export type ResultadoEmpresaFicha =
  | { ok: true }
  | {
      ok: false;
      erro: string;
      conflito?: boolean;
      porCampo?: Partial<Record<'nome' | 'site', string>>;
    };

export function pesquisaAnteriorAoCadastro(
  editadoEm: string | null | undefined,
  solicitadoEm: string,
) {
  return Boolean(editadoEm && Date.parse(editadoEm) > Date.parse(solicitadoEm));
}

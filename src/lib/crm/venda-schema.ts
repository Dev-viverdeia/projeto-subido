import { z } from 'zod';

/** BRL explícito: não adivinha separadores nem transforma 12.50 em R$ 1.250. */
export function valorPrevistoCentavos(entrada: string): number | null | undefined {
  const texto = entrada.trim().replace(/^R\$\s*/, '');
  if (!entrada.trim()) return null;
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(texto)) return undefined;
  const [reais, centavos = ''] = texto.replaceAll('.', '').split(',');
  const valor = Number(reais) * 100 + Number(centavos.padEnd(2, '0'));
  return Number.isSafeInteger(valor) && valor <= 100_000_000_000 ? valor : undefined;
}

export function valorPrevistoCampo(valor: number | null): string {
  return valor === null
    ? ''
    : (valor / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

export const vendaFichaSchema = z.object({
  oportunidade: z.uuid(),
  revisao: z.number().int().nonnegative(),
  titulo: z
    .string()
    .trim()
    .min(1, 'Digite o nome do projeto.')
    .max(180, 'Use até 180 caracteres.')
    .refine(
      (valor) => ![...valor].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127),
      'Remova as quebras de linha deste campo.',
    ),
  valor: z
    .string()
    .trim()
    .max(40, 'Use um valor menor.')
    .refine(
      (valor) => valorPrevistoCentavos(valor) !== undefined,
      'Digite um valor em reais, como 12.500,00 (até 1 bilhão).',
    ),
});

export type EntradaVendaFicha = z.input<typeof vendaFichaSchema>;
export type ResultadoVendaFicha =
  | { ok: true }
  | {
      ok: false;
      erro: string;
      conflito?: boolean;
      porCampo?: Partial<Record<'titulo' | 'valor', string>>;
    };

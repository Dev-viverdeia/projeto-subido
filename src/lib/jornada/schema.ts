import { z } from 'zod';

export const PerfilJornadaSchema = z.object({
  nicho: z
    .string()
    .trim()
    .min(2, 'Descreva o nicho em pelo menos 2 caracteres.')
    .max(100, 'Use no máximo 100 caracteres para o nicho.'),
  projetoInicialId: z.uuid('Escolha um projeto inicial.'),
  posicionamento: z
    .string()
    .trim()
    .min(20, 'Explique o serviço em pelo menos 20 caracteres.')
    .max(280, 'Use no máximo 280 caracteres para o posicionamento.'),
});

export type PerfilJornadaEntrada = z.infer<typeof PerfilJornadaSchema>;

export type EstadoPerfilJornada = {
  sucesso?: string;
  erro?: string;
  porCampo?: Partial<Record<keyof PerfilJornadaEntrada, string>>;
};

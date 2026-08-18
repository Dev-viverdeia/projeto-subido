import { z } from 'zod';

export const EtapaSobralSchema = z.enum([
  'aprender',
  'prospectar',
  'vender',
  'entregar',
  'evoluir',
]);

export type EtapaSobral = z.infer<typeof EtapaSobralSchema>;

export const ETAPAS_SOBRAL: ReadonlyArray<{
  id: EtapaSobral;
  numero: string;
  titulo: string;
  marco: string;
}> = [
  { id: 'aprender', numero: '01', titulo: 'Aprender', marco: 'Escolher uma entrega inicial' },
  {
    id: 'prospectar',
    numero: '02',
    titulo: 'Prospectar',
    marco: 'Criar e qualificar oportunidades',
  },
  { id: 'vender', numero: '03', titulo: 'Vender', marco: 'Apresentar uma proposta clara' },
  { id: 'entregar', numero: '04', titulo: 'Entregar', marco: 'Implementar e obter o aceite' },
  { id: 'evoluir', numero: '05', titulo: 'Evoluir', marco: 'Repetir o que funcionou' },
];

export function indiceDaEtapa(etapa: EtapaSobral): number {
  return ETAPAS_SOBRAL.findIndex((item) => item.id === etapa);
}

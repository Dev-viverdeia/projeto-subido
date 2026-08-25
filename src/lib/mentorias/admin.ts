import { z } from 'zod';

export const FUSO_ADMIN_MENTORIAS = 'America/Sao_Paulo';

/**
 * O navegador envia `datetime-local` sem fuso. A agenda da plataforma trabalha
 * em horário de Brasília, então a fronteira transforma o campo em ISO antes de
 * gravar. O Brasil não usa horário de verão desde 2019; o round-trip abaixo
 * ainda impede datas impossíveis ou que tenham sofrido rollover silencioso.
 */
export function campoBrasiliaParaIso(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;

  const data = new Date(`${valor}:00-03:00`);
  if (Number.isNaN(data.getTime())) return null;
  return isoParaCampoBrasilia(data.toISOString()) === valor ? data.toISOString() : null;
}

export function isoParaCampoBrasilia(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';

  const partes = new Intl.DateTimeFormat('sv-SE', {
    timeZone: FUSO_ADMIN_MENTORIAS,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(data);

  return partes.replace(' ', 'T');
}

const textoOpcional = z
  .string()
  .trim()
  .transform((valor) => (valor === '' ? null : valor));

export const mentoriaAdminSchema = z
  .object({
    titulo: z.string().trim().min(3, 'Escreva um título com pelo menos 3 caracteres.').max(140),
    descricao: z.string().trim().max(2000, 'Use no máximo 2.000 caracteres.'),
    mentor_id: z.uuid('Escolha um mentor.'),
    inicio: z.string().transform((valor, contexto) => {
      const iso = campoBrasiliaParaIso(valor);
      if (!iso) {
        contexto.addIssue({ code: 'custom', message: 'Informe uma data e um horário válidos.' });
        return z.NEVER;
      }
      return iso;
    }),
    fim: z.string().transform((valor, contexto) => {
      const iso = campoBrasiliaParaIso(valor);
      if (!iso) {
        contexto.addIssue({ code: 'custom', message: 'Informe uma data e um horário válidos.' });
        return z.NEVER;
      }
      return iso;
    }),
    vagas: z.coerce.number().int().min(1, 'A sessão precisa ter pelo menos 1 vaga.').max(1000),
    custo_creditos: z.coerce.number().int().min(0, 'O custo não pode ser negativo.').max(100),
    sala_url: textoOpcional.pipe(
      z.url('Informe um link completo, começando com https://').nullable(),
    ),
    status: z.enum(['rascunho', 'publicado', 'arquivado']),
  })
  .superRefine((dados, contexto) => {
    if (new Date(dados.fim).getTime() <= new Date(dados.inicio).getTime()) {
      contexto.addIssue({
        code: 'custom',
        path: ['fim'],
        message: 'O encerramento precisa ser depois do início.',
      });
    }
  });

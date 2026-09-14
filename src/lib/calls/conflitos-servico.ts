import 'server-only';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { createClient } from '@/lib/supabase/server';
import type { ConflitoHorario } from './conflitos-modelo';

const Linhas = z
  .array(
    z.object({
      id: z.uuid(),
      titulo: z.string().min(1).max(180),
      agendada_para: z.iso.datetime({ offset: true }),
      duracao_minutos: z.number().int().min(15).max(240),
      total: z.number().int().positive(),
      versao: z.string().regex(/^[a-f0-9]{32}$/),
    }),
  )
  .max(5);

type Conferencia = { conflito?: ConflitoHorario; erro?: string };

export async function conferirHorario(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dados: { inicio: string; duracao: number; ignorar?: string; confirmacao?: string },
): Promise<Conferencia> {
  try {
    const { data, error } = await supabase.rpc('calls_conferir_horario', {
      p_inicio: dados.inicio,
      p_duracao_minutos: dados.duracao,
      p_ignorar: dados.ignorar,
    });
    const resultado = Linhas.safeParse(data);
    if (error || !resultado.success) throw new Error('consulta_indisponivel');
    if (!resultado.data.length) return {};
    const inicio = new Date(dados.inicio).toISOString();
    const { total, versao } = resultado.data[0]!;
    // Inclui a assinatura de TODOS os conflitos, não só os cinco visíveis.
    const confirmacao = createHash('sha256')
      .update(JSON.stringify([inicio, dados.duracao, dados.ignorar ?? null, total, versao]))
      .digest('hex');
    if (dados.confirmacao === confirmacao) return {};
    return {
      conflito: {
        inicio,
        duracao: dados.duracao,
        total,
        confirmacao,
        reunioes: resultado.data.map((r) => ({
          id: r.id,
          titulo: r.titulo,
          inicio: r.agendada_para,
          duracao: r.duracao_minutos,
        })),
      },
    };
  } catch {
    return { erro: 'Não foi possível conferir os horários. Nada foi alterado. Tente novamente.' };
  }
}

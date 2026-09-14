import 'server-only';
import { z } from 'zod';
import type { createClient } from '@/lib/supabase/server';

const Horarios = z.array(z.object({ inicio: z.iso.datetime({ offset: true }) })).max(3);

/** Falha opcional de sugestões nunca apaga o conflito nem autoriza o agendamento. */
export async function buscarHorariosAlternativos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dados: { inicio: string; duracao: number; fuso?: string; ignorar?: string },
): Promise<string[] | undefined> {
  if (!dados.fuso || dados.fuso.length > 100) return;
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: dados.fuso }).format();
    const { data, error } = await supabase.rpc('calls_sugerir_horarios', {
      p_inicio: dados.inicio,
      p_duracao_minutos: dados.duracao,
      p_fuso: dados.fuso,
      p_ignorar: dados.ignorar,
    });
    const resultado = Horarios.safeParse(data);
    if (error || !resultado.success) return;
    const horarios = resultado.data.map((r) => new Date(r.inicio).toISOString());
    if (
      horarios.some(
        (inicio, i) => Date.parse(inicio) <= Date.parse(i ? horarios[i - 1]! : dados.inicio),
      )
    )
      return;
    return horarios;
  } catch {
    return;
  }
}

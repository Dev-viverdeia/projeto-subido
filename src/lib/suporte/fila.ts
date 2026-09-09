import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIAS } from './contrato';

export async function resumoFilaSuporte(metaHoras: number, admin: boolean) {
  const db = await createClient();
  const agora = Date.now();
  const [{ count: foraMeta }, { count: emailsAtrasados }, temas] = await Promise.all([
    db
      .from('suporte_atendimentos')
      .select('id', { count: 'exact', head: true })
      .eq('verificado', true)
      .in('status', ['recebido', 'em_atendimento'])
      .lt('aguardando_equipe_desde', new Date(agora - metaHoras * 3600000).toISOString()),
    db
      .from('suporte_email_recebidos')
      .select('id', { count: 'exact', head: true })
      .in('estado', ['pendente', 'processando'])
      .lt('criado_em', new Date(agora - 180000).toISOString()),
    admin
      ? Promise.all(
          Object.entries(CATEGORIAS).map(async ([id, nome]) => {
            const { count } = await db
              .from('suporte_atendimentos')
              .select('id', { count: 'exact', head: true })
              .eq('verificado', true)
              .eq('categoria', id)
              .gte('criado_em', new Date(agora - 30 * 86400000).toISOString());
            return { id, nome, total: count ?? 0 };
          }),
        )
      : Promise.resolve([]),
  ]);
  return { foraMeta, emailsAtrasados, temas };
}

import { CentralAjuda } from '@/components/suporte/CentralAjuda';
import { artigosSuporte, equipeSuporte, listarAtendimentos } from '@/lib/suporte/servidor';
import { createClient } from '@/lib/supabase/server';
import { suporteEmailEnv } from '@/lib/env';
export const metadata = { title: 'Central de ajuda' };
export default async function SuportePage() {
  const [artigos, equipe] = await Promise.all([artigosSuporte(), equipeSuporte()]);
  const db = await createClient();
  const email = suporteEmailEnv();
  const [{ casos }, { data: config }] = await Promise.all([
    listarAtendimentos(),
    db.from('suporte_configuracao').select('horario,aviso').eq('id', true).maybeSingle(),
  ]);
  return (
    <CentralAjuda
      artigos={artigos}
      autenticado
      equipe={equipe}
      atendimentos={casos}
      horario={config?.horario}
      aviso={config?.aviso}
      emailAjuda={email ? `ajuda@${email.dominio}` : ''}
    />
  );
}

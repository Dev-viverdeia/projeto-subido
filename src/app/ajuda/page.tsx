import { CentralAjuda } from '@/components/suporte/CentralAjuda';
import { artigosSuporte, usuarioSuporte, equipeSuporte } from '@/lib/suporte/servidor';
import { createClient } from '@/lib/supabase/server';
import { suporteEmailEnv } from '@/lib/env';
export default async function AjudaPage() {
  const [artigos, user, equipe] = await Promise.all([
    artigosSuporte(),
    usuarioSuporte(),
    equipeSuporte(),
  ]);
  const db = await createClient();
  const email = suporteEmailEnv();
  const { data: config } = await db.from('suporte_configuracao').select('horario,aviso').single();
  return (
    <CentralAjuda
      artigos={artigos}
      autenticado={!!user}
      equipe={equipe}
      horario={config?.horario}
      aviso={config?.aviso}
      emailAjuda={email ? `ajuda@${email.dominio}` : ''}
    />
  );
}

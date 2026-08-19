'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { decifrarTokenGoogle } from './tokens';
import { revogarTokenGoogle } from './oauth';

export async function desconectarGoogleCalendar(): Promise<void> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return;

  const { data } = await supabase.rpc('google_calendar_obter_token');
  const tokenCifrado = data?.[0]?.refresh_token_cifrado;
  if (tokenCifrado) {
    try {
      await revogarTokenGoogle(decifrarTokenGoogle(tokenCifrado));
    } catch (erro) {
      console.error('[google-calendar:revogar]', erro);
    }
  }

  const { error } = await supabase.rpc('google_calendar_desconectar');
  if (error) console.error(`[google-calendar:desconectar] ${error.code}: ${error.message}`);
  revalidatePath('/conta');
  revalidatePath('/calls');
}

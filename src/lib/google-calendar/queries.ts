import 'server-only';

import { cache } from 'react';
import { googleCalendarConfigurado } from './oauth';
import { handleError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export type EstadoGoogleCalendar = {
  configurado: boolean;
  conectado: boolean;
  email: string | null;
  status: 'ativa' | 'reconectar' | 'erro' | 'desconectada';
  ultimoErro: string | null;
};

function statusConexaoValido(
  valor: string,
): valor is Exclude<EstadoGoogleCalendar['status'], 'desconectada'> {
  return valor === 'ativa' || valor === 'reconectar' || valor === 'erro';
}

export const obterEstadoGoogleCalendar = cache(async (): Promise<EstadoGoogleCalendar> => {
  const configurado = googleCalendarConfigurado();
  if (!configurado) {
    return {
      configurado: false,
      conectado: false,
      email: null,
      status: 'desconectada',
      ultimoErro: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('google_calendar_conexoes')
    .select('google_email, status, ultimo_erro')
    .maybeSingle();

  if (error) throw handleError(error, 'google-calendar:estado');
  if (!data) {
    return {
      configurado: true,
      conectado: false,
      email: null,
      status: 'desconectada',
      ultimoErro: null,
    };
  }

  const status = statusConexaoValido(data.status) ? data.status : 'erro';
  return {
    configurado: true,
    conectado: status === 'ativa',
    email: data.google_email,
    status,
    ultimoErro: data.ultimo_erro,
  };
});

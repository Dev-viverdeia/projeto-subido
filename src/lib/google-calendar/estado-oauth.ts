import 'server-only';

import { env } from '@/lib/env';
import { ROTAS_APP } from '@/lib/routes';

export const GOOGLE_CALENDAR_COOKIES = {
  state: 'subido_google_calendar_state',
  verifier: 'subido_google_calendar_verifier',
  retorno: 'subido_google_calendar_retorno',
} as const;

/** Impede que o retorno do OAuth vire um redirecionamento para fora da plataforma. */
export function retornoGoogleCalendarSeguro(valor: string | null | undefined) {
  if (!valor?.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) {
    return '/conta';
  }

  const legadoAtualizado = valor
    .replace(/^\/crm(?=\/|\?|$)/, '/vendas')
    .replace(/^\/calls(?=\/|\?|$)/, '/reunioes');
  const url = new URL(legadoAtualizado, env.NEXT_PUBLIC_SITE_URL);
  const permitida = ROTAS_APP.some(
    (rota) => url.pathname === rota || url.pathname.startsWith(`${rota}/`),
  );
  return permitida ? `${url.pathname}${url.search}` : '/conta';
}

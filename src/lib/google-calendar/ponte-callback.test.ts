import { describe, expect, it } from 'vitest';

import { destinoPonteGoogleCalendar } from './ponte-callback';

describe('destinoPonteGoogleCalendar', () => {
  it('leva o callback técnico para o domínio oficial preservando código e estado', () => {
    const destino = destinoPonteGoogleCalendar({
      requestUrl: new URL(
        'https://projeto-subido.vercel.app/api/integracoes/google-calendar/callback?code=abc&state=xyz',
      ),
      siteUrl: 'https://subido.viverdeia.ai',
      redirectUri: 'https://projeto-subido.vercel.app/api/integracoes/google-calendar/callback',
    });

    expect(destino?.toString()).toBe(
      'https://subido.viverdeia.ai/api/integracoes/google-calendar/callback?code=abc&state=xyz',
    );
  });

  it('não cria ponte quando o callback já chegou ao domínio oficial', () => {
    expect(
      destinoPonteGoogleCalendar({
        requestUrl: new URL(
          'https://subido.viverdeia.ai/api/integracoes/google-calendar/callback?code=abc',
        ),
        siteUrl: 'https://subido.viverdeia.ai',
        redirectUri: 'https://projeto-subido.vercel.app/api/integracoes/google-calendar/callback',
      }),
    ).toBeNull();
  });

  it('não redireciona uma origem que não seja o callback configurado', () => {
    expect(
      destinoPonteGoogleCalendar({
        requestUrl: new URL(
          'https://exemplo.com/api/integracoes/google-calendar/callback?code=abc',
        ),
        siteUrl: 'https://subido.viverdeia.ai',
        redirectUri: 'https://projeto-subido.vercel.app/api/integracoes/google-calendar/callback',
      }),
    ).toBeNull();
  });
});

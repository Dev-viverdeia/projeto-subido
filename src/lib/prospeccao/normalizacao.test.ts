import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { redesDeUrls } from './normalizacao';

describe('normalização de perfis sociais', () => {
  it('aceita apenas páginas de perfil e reduz links profundos ao perfil', () => {
    expect(
      redesDeUrls([
        'https://instagram.com/clinica.aurora/reels/',
        'https://linkedin.com/company/clinica-aurora/posts/',
        'https://youtube.com/@clinicaaurora/videos',
        'https://tiktok.com/@clinicaaurora/video/123',
        'https://x.com/clinicaaurora/status/123',
      ]),
    ).toEqual([
      { rede: 'instagram', url: 'https://instagram.com/clinica.aurora' },
      { rede: 'linkedin', url: 'https://linkedin.com/company/clinica-aurora' },
      { rede: 'tiktok', url: 'https://tiktok.com/@clinicaaurora' },
      { rede: 'youtube', url: 'https://youtube.com/@clinicaaurora' },
    ]);
  });

  it('rejeita vídeos, páginas de suporte e rotas genéricas como perfis', () => {
    expect(
      redesDeUrls([
        'https://youtube.com/embed/HTHXU0wIOww',
        'https://youtu.be/HTHXU0wIOww',
        'https://twitter.com/suporte',
        'https://facebook.com/profile.php',
        'https://linkedin.com/feed/update/urn:li:activity:123',
        'https://tiktok.com/video/123',
        'https://instagram.com/reel/publicacao',
      ]),
    ).toEqual([]);
  });

  it('preserva o identificador necessário de perfis legados do Facebook', () => {
    expect(redesDeUrls(['https://facebook.com/profile.php?id=123456&ref=page_internal'])).toEqual([
      { rede: 'facebook', url: 'https://facebook.com/profile.php?id=123456' },
    ]);
  });

  it('mantém no máximo um perfil válido de cada rede', () => {
    expect(
      redesDeUrls([
        'https://instagram.com/clinicaaurora',
        'https://instagram.com/outro-perfil',
        'https://facebook.com/clinicaaurora',
        'https://linkedin.com/company/clinicaaurora',
      ]),
    ).toHaveLength(3);
  });
});

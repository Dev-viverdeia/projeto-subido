import type { LeadProspeccaoEntrada } from './schema';

type RedeSocial = LeadProspeccaoEntrada['redes_sociais'][number];

const ORDEM_REDES: RedeSocial['rede'][] = [
  'instagram',
  'linkedin',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'pinterest',
];

const reservar = (...valores: string[]) => new Set(valores);
const RESERVADAS = {
  instagram: reservar(
    'p',
    'reel',
    'reels',
    'stories',
    'explore',
    'accounts',
    'direct',
    'about',
    'legal',
    'developer',
  ),
  facebook: reservar(
    'share',
    'sharer',
    'dialog',
    'plugins',
    'watch',
    'gaming',
    'marketplace',
    'events',
    'help',
    'privacy',
  ),
  x: reservar(
    'intent',
    'share',
    'search',
    'i',
    'home',
    'explore',
    'notifications',
    'messages',
    'settings',
    'compose',
    'jobs',
    'about',
    'help',
    'support',
    'suporte',
    'privacy',
    'terms',
  ),
  pinterest: reservar('pin', 'ideas', 'search', 'today'),
} as const;

function urlPublica(valor: string): URL | null {
  const recebida = valor.trim();
  if (!recebida) return null;
  try {
    const url = new URL(recebida.startsWith('http') ? recebida : `https://${recebida}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function redeDaUrl(url: URL): RedeSocial['rede'] | null {
  const dominio = url.hostname.replace(/^www\./, '').toLowerCase();
  const pertenceA = (raiz: string) => dominio === raiz || dominio.endsWith(`.${raiz}`);
  if (pertenceA('instagram.com')) return 'instagram';
  if (pertenceA('facebook.com') || pertenceA('fb.com')) return 'facebook';
  if (pertenceA('linkedin.com')) return 'linkedin';
  if (pertenceA('x.com') || pertenceA('twitter.com')) return 'x';
  if (pertenceA('tiktok.com')) return 'tiktok';
  if (pertenceA('youtube.com') || pertenceA('youtu.be')) return 'youtube';
  if (pertenceA('pinterest.com') || pertenceA('pin.it')) return 'pinterest';
  return null;
}

function perfilSocial(valor: string): RedeSocial | null {
  const url = urlPublica(valor);
  if (!url) return null;
  const rede = redeDaUrl(url);
  if (!rede) return null;
  const partes = url.pathname.split('/').filter(Boolean);
  const primeira = partes[0]?.toLowerCase() ?? '';
  if (!primeira) return null;

  let caminhoCanonico: string;
  switch (rede) {
    case 'instagram':
      if (RESERVADAS.instagram.has(primeira)) return null;
      caminhoCanonico = `/${partes[0]}`;
      break;
    case 'facebook': {
      if (primeira === 'profile.php') {
        const id = url.searchParams.get('id')?.trim();
        if (!id || !/^\d+$/.test(id)) return null;
        url.pathname = '/profile.php';
        url.search = new URLSearchParams({ id }).toString();
        url.hash = '';
        return { rede, url: url.toString() };
      }
      if (RESERVADAS.facebook.has(primeira)) return null;
      caminhoCanonico =
        (primeira === 'pages' || primeira === 'people') && partes.length >= 3
          ? `/${partes.slice(0, 3).join('/')}`
          : `/${partes[0]}`;
      break;
    }
    case 'linkedin':
      if (!['in', 'company', 'school', 'showcase'].includes(primeira) || !partes[1]) return null;
      caminhoCanonico = `/${primeira}/${partes[1]}`;
      break;
    case 'x':
      if (partes.length !== 1 || RESERVADAS.x.has(primeira)) return null;
      caminhoCanonico = `/${partes[0]}`;
      break;
    case 'tiktok':
      if (!primeira.startsWith('@') || primeira.length < 2) return null;
      caminhoCanonico = `/${partes[0]}`;
      break;
    case 'youtube': {
      const dominio = url.hostname.replace(/^www\./, '').toLowerCase();
      if (dominio === 'youtu.be' || dominio.endsWith('.youtu.be')) return null;
      if (primeira.startsWith('@') && primeira.length > 1) {
        caminhoCanonico = `/${partes[0]}`;
        break;
      }
      if (!['channel', 'c', 'user'].includes(primeira) || !partes[1]) return null;
      caminhoCanonico = `/${primeira}/${partes[1]}`;
      break;
    }
    case 'pinterest':
      if (RESERVADAS.pinterest.has(primeira)) return null;
      caminhoCanonico = `/${partes[0]}`;
      break;
  }

  url.pathname = caminhoCanonico;
  url.search = '';
  url.hash = '';
  return { rede, url: url.toString().replace(/\/$/, '') };
}

export function redesDeUrls(valores: string[]): RedeSocial[] {
  const porRede = new Map<RedeSocial['rede'], RedeSocial>();
  for (const valor of valores) {
    const perfil = perfilSocial(valor);
    if (perfil && !porRede.has(perfil.rede)) porRede.set(perfil.rede, perfil);
  }
  return ORDEM_REDES.flatMap((rede) => {
    const perfil = porRede.get(rede);
    return perfil ? [perfil] : [];
  });
}

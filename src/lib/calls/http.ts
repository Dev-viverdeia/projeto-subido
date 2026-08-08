export function requisicaoDaMesmaOrigem(request: Request): boolean {
  const origem = request.headers.get('origin');
  return !origem || origem === new URL(request.url).origin;
}

export function semCache() {
  return { 'Cache-Control': 'private, no-store' };
}

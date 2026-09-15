const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OrigemProspeccao = { lista: string; empresa: string };

export function origemProspeccao(lista: unknown, empresa: unknown): OrigemProspeccao | null {
  return typeof lista === 'string' &&
    UUID.test(lista) &&
    typeof empresa === 'string' &&
    UUID.test(empresa)
    ? { lista, empresa }
    : null;
}

export function hrefFichaProspeccao(
  oportunidade: string,
  origem: OrigemProspeccao | null,
  nova = false,
) {
  const parametros = new URLSearchParams();
  if (nova) parametros.set('novo', '1');
  if (nova || origem) parametros.set('origem', 'prospeccao');
  if (origem) {
    parametros.set('lista', origem.lista);
    parametros.set('empresa', origem.empresa);
  }
  return `/vendas/${oportunidade}${parametros.size ? `?${parametros}` : ''}`;
}

export function hrefListaProspeccao(origem: OrigemProspeccao) {
  return `/prospeccao?${new URLSearchParams(origem)}#empresa-${origem.empresa}`;
}

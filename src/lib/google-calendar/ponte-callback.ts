/**
 * Mantém o callback já autorizado no Google enquanto o domínio oficial é
 * homologado. O código volta primeiro pelo endereço técnico e, sem ser
 * processado ali, segue para a mesma rota no domínio da plataforma. Assim os
 * cookies de sessão e PKCE continuam sendo lidos somente no domínio oficial.
 */
export function destinoPonteGoogleCalendar({
  requestUrl,
  siteUrl,
  redirectUri,
}: {
  requestUrl: URL;
  siteUrl: string;
  redirectUri: string;
}) {
  const origemRecebida = requestUrl.origin;
  const origemCallback = new URL(redirectUri).origin;
  const origemOficial = new URL(siteUrl).origin;

  if (origemRecebida !== origemCallback || origemCallback === origemOficial) return null;

  const destino = new URL(requestUrl.pathname, origemOficial);
  destino.search = requestUrl.search;
  return destino;
}

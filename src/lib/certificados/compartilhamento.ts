export const LINKEDIN_PERFIL = 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME';

export const TAMANHO_IMAGEM_CERTIFICADO = { width: 1200, height: 627 };

export function linkPublicacaoLinkedIn(urlPublica: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: urlPublica })}`;
}

export function dadosPerfilCertificado(
  titulo: string,
  codigo: string,
  url: string,
  data?: string | null,
) {
  const campos = [
    { rotulo: 'Nome', valor: titulo },
    { rotulo: 'Organização emissora', valor: 'Viver de IA' },
  ];
  if (data && Number.isFinite(new Date(data).getTime())) {
    campos.push({
      rotulo: 'Data de emissão',
      valor: new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
      }).format(new Date(data)),
    });
  }
  return [
    ...campos,
    { rotulo: 'Código da credencial', valor: codigo },
    { rotulo: 'URL da credencial', valor: url },
  ];
}

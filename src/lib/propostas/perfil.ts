import type { PerfilComercial } from '@/lib/perfil-comercial/schema';
import type { DocumentoProposta } from './schema';

/**
 * Completa documentos antigos sem reescrever propostas já identificadas.
 * Depois do primeiro salvamento, a identidade vira parte do snapshot aceito pelo cliente.
 */
export function completarDocumentoComPerfil(
  documento: DocumentoProposta,
  perfil: PerfilComercial | null,
): DocumentoProposta {
  if (!perfil) return documento;

  return {
    ...documento,
    fornecedor: documento.fornecedor ?? {
      nomeResponsavel: perfil.nomeResponsavel,
      nomeNegocio: perfil.nomeNegocio,
      email: perfil.email,
      telefone: perfil.telefone,
      site: perfil.site,
      logoUrl: perfil.logoUrl,
    },
    investimento: {
      ...documento.investimento,
      linkPagamento: documento.investimento.linkPagamento ?? perfil.linkPagamentoPadrao ?? null,
    },
  };
}

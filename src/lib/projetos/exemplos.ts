import { exemploAulaNina, exemploPassoNina } from './exemplos-nina';
import { exemploAulaProspeccao, exemploPassoProspeccao } from './exemplos-prospeccao';

/** Correspondência explícita; conteúdo novo mantém as instruções originais como fallback. */
export function exemploPassoProjeto(slug: string, passoId: string) {
  return exemploPassoNina(slug, passoId) ?? exemploPassoProspeccao(slug, passoId);
}
export function exemploAulaProjeto(slug: string, titulo: string) {
  return exemploAulaNina(slug, titulo) ?? exemploAulaProspeccao(slug, titulo);
}

import { z } from 'zod';

export const TAMANHO_PAGINA_AGENDA = 12;
export const VISOES_AGENDA = [
  { id: 'proximas', rotulo: 'Próximas' },
  { id: 'pendentes', rotulo: 'Para revisar' },
  { id: 'historico', rotulo: 'Histórico' },
] as const;
export type VisaoAgenda = (typeof VISOES_AGENDA)[number]['id'];
export type FiltrosAgenda = {
  visao: VisaoAgenda;
  busca: string;
  cursor?: { data: string; id: string };
};

export function lerFiltrosAgenda(
  parametros: Record<string, string | string[] | undefined>,
): FiltrosAgenda {
  const visao = z
    .enum(['proximas', 'pendentes', 'historico'])
    .catch('proximas')
    .parse(parametros.visao);
  const busca = typeof parametros.busca === 'string' ? parametros.busca.trim().slice(0, 100) : '';
  const data = z.iso.datetime({ offset: true }).safeParse(parametros.antes);
  const id = z.uuid().safeParse(parametros.cursor);
  return {
    visao,
    busca,
    cursor: data.success && id.success ? { data: data.data, id: id.data } : undefined,
  };
}

export function hrefAgenda(filtros: FiltrosAgenda, base = '/reunioes'): string {
  const parametros = new URLSearchParams();
  if (filtros.visao !== 'proximas') parametros.set('visao', filtros.visao);
  if (filtros.busca) parametros.set('busca', filtros.busca);
  if (filtros.cursor) {
    parametros.set('antes', filtros.cursor.data);
    parametros.set('cursor', filtros.cursor.id);
  }
  return `${base}${parametros.size ? `?${parametros}` : ''}`;
}

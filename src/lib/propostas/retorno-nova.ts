import { z } from 'zod';

/** Preserva apenas escolhas válidas, sem aceitar uma URL de retorno arbitrária. */
export function retornoNovaProposta(
  campos: { oportunidade: unknown; origem: unknown; reuniao?: unknown },
  erro: string,
) {
  const parametros = new URLSearchParams();
  const oportunidade = z.uuid().safeParse(campos.oportunidade);
  const reuniao = z.uuid().safeParse(campos.reuniao);
  if (oportunidade.success) parametros.set('oportunidade', oportunidade.data);
  parametros.set('erro', erro);
  if (typeof campos.origem === 'string' && campos.origem.length <= 200) {
    const [tipo, id] = campos.origem.split(':', 2);
    if (tipo === 'projeto' && id) parametros.set('projeto', id);
    if (tipo === 'estudio' && id && z.uuid().safeParse(id).success) parametros.set('builder', id);
    if (campos.origem === 'sem-base') parametros.set('origem', 'sem-base');
  }
  if (reuniao.success) parametros.set('reuniao', reuniao.data);
  return `/propostas/nova?${parametros.toString()}`;
}

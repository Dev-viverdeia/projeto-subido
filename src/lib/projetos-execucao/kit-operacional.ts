import type { RoteiroProjeto } from '@/lib/projetos/roteiro';

export type KitOperacionalTarefa = {
  projetoSlug: string;
  duracao: string | null;
  insumos: string[];
  checklist: string[];
  cuidado: string | null;
  modelo: {
    titulo: string;
    conteudo: string;
  } | null;
};

function extrairIdEditorial(passoId: string): string {
  const partes = passoId.split(':').filter(Boolean);
  return partes.at(-1) ?? passoId;
}

/**
 * Liga uma tarefa vendida ao mesmo passo editorial usado no minicurso.
 *
 * As tarefas persistidas usam `fase:passo`; registros antigos e fixtures podem
 * guardar somente `passo`. O fallback mantém os dois formatos compatíveis sem
 * copiar conteúdo educacional para a tabela operacional.
 */
export function montarKitOperacionalTarefa({
  projetoSlug,
  roteiro,
  faseId,
  passoId,
}: {
  projetoSlug: string;
  roteiro: RoteiroProjeto;
  faseId: string;
  passoId: string;
}): KitOperacionalTarefa | null {
  const fase = roteiro.fases.find((item) => item.id === faseId);
  if (!fase) return null;

  const idEditorial = extrairIdEditorial(passoId);
  const passo = fase.passos.find((item) => item.id === passoId || item.id === idEditorial);
  if (!passo) return null;

  const temMaterial =
    Boolean(passo.duracao) ||
    passo.insumos.length > 0 ||
    passo.execucao.length > 0 ||
    Boolean(passo.atencao) ||
    Boolean(passo.modelo);

  if (!temMaterial) return null;

  return {
    projetoSlug,
    duracao: passo.duracao ?? null,
    insumos: passo.insumos,
    checklist: passo.execucao,
    cuidado: passo.atencao ?? null,
    modelo: passo.modelo ?? null,
  };
}

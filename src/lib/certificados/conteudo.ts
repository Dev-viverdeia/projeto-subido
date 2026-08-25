import 'server-only';

import { obterFormacao, obterSolucao } from '@/lib/conteudo/queries';
import { idsAulasProjeto, idsPassosProjeto } from '@/lib/projetos/roteiro';

export type OrigemCertificado = 'formacao' | 'solucao';

export async function carregarCertificavel(origem: OrigemCertificado, slug: string) {
  if (origem === 'formacao') {
    const formacao = await obterFormacao(slug);
    if (!formacao) return null;
    return {
      titulo: formacao.titulo,
      aprendizadoIds: formacao.modulos.flatMap((modulo) => modulo.aulas.map((aula) => aula.id)),
      implementacaoIds: [],
      href: `/formacoes/${slug}`,
    };
  }

  const projeto = await obterSolucao(slug);
  if (!projeto) return null;
  return {
    titulo: projeto.titulo,
    aprendizadoIds: projeto.projeto ? idsAulasProjeto(projeto.slug, projeto.projeto.roteiro) : [],
    implementacaoIds: projeto.projeto
      ? idsPassosProjeto(projeto.slug, projeto.projeto.roteiro)
      : projeto.itens.filter((item) => item.tipo === 'etapa').map((item) => item.id),
    href: `/solucoes/${slug}`,
  };
}

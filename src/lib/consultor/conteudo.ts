import { z } from 'zod';
import type { RecomendacaoConteudoSobral, SinaisSobral } from './direcao';

export const CartaoProdutoSchema = z.object({
  tipo: z.enum(['aula', 'formacao', 'projeto', 'ferramenta']),
  chave: z.string(),
  titulo: z.string(),
  rotulo: z.string(),
  href: z.string().startsWith('/'),
  motivo: z.string(),
});

const CartaoAntigoSchema = z
  .object({
    slug: z.string(),
    titulo: z.string(),
    categoria: z.string().nullable(),
  })
  .transform((cartao) => ({
    tipo: 'projeto' as const,
    chave: cartao.slug,
    titulo: cartao.titulo,
    rotulo: cartao.categoria ?? 'Projeto',
    href: `/solucoes/${cartao.slug}`,
    motivo: 'Projeto citado nesta resposta.',
  }));

export const CartoesProdutoPersistidosSchema = z.array(
  z.union([CartaoProdutoSchema, CartaoAntigoSchema]),
);

export type CartaoProduto = z.infer<typeof CartaoProdutoSchema>;

export function resolverRecomendacoes(
  recomendacoes: RecomendacaoConteudoSobral[],
  sinais: SinaisSobral,
): CartaoProduto[] {
  const resolvidas = recomendacoes.flatMap<CartaoProduto>((recomendacao) => {
    if (recomendacao.tipo === 'aula') {
      const aula = sinais.aulas.find((item) => item.id === recomendacao.chave);
      return aula
        ? [
            {
              tipo: 'aula',
              chave: aula.id,
              titulo: aula.titulo,
              rotulo: `Aula · ${aula.formacaoTitulo}`,
              href: `/formacoes/${aula.formacaoSlug}/aula/${aula.id}`,
              motivo: recomendacao.motivo,
            },
          ]
        : [];
    }

    if (recomendacao.tipo === 'formacao') {
      const formacao = sinais.formacoes.find((item) => item.slug === recomendacao.chave);
      return formacao
        ? [
            {
              tipo: 'formacao',
              chave: formacao.slug,
              titulo: formacao.titulo,
              rotulo: 'Formação',
              href: `/formacoes/${formacao.slug}`,
              motivo: recomendacao.motivo,
            },
          ]
        : [];
    }

    if (recomendacao.tipo === 'ferramenta') {
      const ferramenta = sinais.ferramentas.find((item) => item.chave === recomendacao.chave);
      return ferramenta
        ? [
            {
              tipo: 'ferramenta',
              chave: ferramenta.chave,
              titulo: ferramenta.titulo,
              rotulo: `Ferramenta · ${ferramenta.projetoTitulo}`,
              href: `/solucoes/${ferramenta.projetoSlug}`,
              motivo: recomendacao.motivo,
            },
          ]
        : [];
    }

    const projeto = sinais.catalogo.find((item) => item.slug === recomendacao.chave);
    return projeto
      ? [
          {
            tipo: 'projeto',
            chave: projeto.slug,
            titulo: projeto.titulo,
            rotulo: projeto.categoria ?? 'Projeto',
            href: `/solucoes/${projeto.slug}`,
            motivo: recomendacao.motivo,
          },
        ]
      : [];
  });

  return resolvidas
    .filter(
      (cartao, indice, todos) =>
        todos.findIndex((outro) => outro.tipo === cartao.tipo && outro.chave === cartao.chave) ===
        indice,
    )
    .slice(0, 3);
}

import { RotuloSecao } from '../../_components/RotuloSecao';

/**
 * O CATCH-ALL QUE IMPEDE A TRILHA DE FICAR PRESA.
 *
 * O bug que ele conserta, com a doc do Next na mão: em navegação SOFT o Next
 * "mantém a subpágina ativa do slot, mesmo que ela não case com a URL atual"
 * (parallel-routes.md, seção Behavior). Sem uma rota que case com `/solucoes`,
 * voltar da ficha para o catálogo deixava o cabeçalho exibindo a trilha da
 * solução que a pessoa acabou de sair — apontando para uma página onde ela não
 * está mais. O `default.tsx` não salva: ele só entra em recarga DURA.
 *
 * Um arquivo cobre todas as rotas, presentes e futuras. Alternativa seria um
 * `page.tsx` por listagem — sete arquivos hoje, e um esquecimento amanhã voltando
 * a prender a trilha. Aqui o esquecimento é impossível: o que não casa com uma
 * rota específica cai aqui.
 *
 * A resolução do Next é do mais específico para o menos: `/solucoes/[slug]` casa
 * a trilha da ficha, `/solucoes` cai neste catch-all.
 */
export default function TrilhaDeSecao() {
  return <RotuloSecao />;
}

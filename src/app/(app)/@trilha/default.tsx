import { RotuloSecao } from '../_components/RotuloSecao';

/**
 * O que o slot `@trilha` mostra quando a rota não declara uma trilha própria.
 *
 * `default.tsx` é obrigatório num slot: sem ele, uma navegação DURA para
 * qualquer rota sem trilha devolve 404 no slot inteiro. E ele não é um vazio —
 * é o estado anterior do cabeçalho, o nome da seção. Rota de detalhe futura que
 * esquecer de declarar trilha degrada para a seção, nunca para um topo em branco.
 */
export default function TrilhaPadrao() {
  return <RotuloSecao />;
}

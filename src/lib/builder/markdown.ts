import type { DocumentoSolucao } from './schema';

/**
 * O projeto em Markdown, pronto para colar.
 *
 * POR QUE ISTO EXISTE: o documento não termina nesta tela. Ele vai para uma
 * proposta, um Notion, um e-mail para o cliente — e sem uma saída, o caminho é
 * selecionar a página com o mouse, o que traz junto rótulos de seção, contadores
 * e o texto dos botões. Markdown é o formato que cola com estrutura em todos
 * esses destinos.
 *
 * NÃO É UM SEGUNDO LAYOUT. A ordem e os títulos são os mesmos da ficha; o que
 * muda é só o meio. Duas ordens diferentes para o mesmo documento seriam duas
 * versões da verdade, e a que o cliente lê seria a que ninguém revisou.
 */
export function paraMarkdown(documento: DocumentoSolucao): string {
  const l: string[] = [];

  l.push(`# ${documento.titulo}`, '', documento.resumo, '');

  l.push(
    `**Viabilidade:** ${documento.viabilidade.nivel}`,
    '',
    documento.viabilidade.justificativa,
    '',
  );

  l.push('## Como funciona', '', documento.arquitetura, '');

  l.push('## Ferramentas', '');
  for (const f of documento.ferramentas) {
    l.push(`- **${f.nome}** (${f.custo}) — ${f.papel}`);
  }
  l.push('');

  l.push('## Passo a passo', '');
  documento.etapas.forEach((etapa, i) => {
    l.push(`### ${String(i + 1).padStart(2, '0')}. ${etapa.titulo}`, '', etapa.descricao, '');
    if (etapa.ferramentas.length > 0) l.push(`_${etapa.ferramentas.join(' · ')}_`, '');
  });

  if (documento.prompts.length > 0) {
    l.push('## Prompts', '');
    for (const p of documento.prompts) {
      /* Cerca de código para o prompt sobreviver à colagem: sem ela, qualquer
         `#` ou `-` no meio do texto vira título ou lista no destino. */
      l.push(`### ${p.titulo}`, '', '```', p.conteudo, '```', '');
    }
  }

  l.push('## Economia estimada', '', `**${documento.economia.horas_por_mes} h/mês**`, '');
  l.push('Premissas desta conta:', '');
  for (const premissa of documento.economia.premissas) l.push(`- ${premissa}`);
  l.push('');

  l.push('## Riscos', '');
  for (const r of documento.riscos) {
    l.push(`- **${r.risco}**`, `  - Mitigação: ${r.mitigacao}`);
  }
  l.push('');

  l.push('## Fora do escopo', '');
  for (const item of documento.fora_do_escopo) l.push(`- ${item}`);
  l.push(
    '',
    '> O que está nesta lista não faz parte da entrega. Combinar a fronteira antes é o que evita a discussão de escopo na terceira semana.',
    '',
  );

  return l.join('\n');
}

# Apresentação: legibilidade e carregamento

## Escopo

Página `/` do grupo de marketing. Não altera o Início autenticado, Formações, ofertas,
conteúdo comercial, login, créditos ou banco. A entrada oficial `subido.viverdeia.ai/`
continua redirecionando para `/entrar`; a landing permanece no domínio técnico.

## Ajustes

- Hero visível no HTML inicial, sem cascata que adie título, texto e ações.
- Notas de fontes e resultados em 14 px e tom legível do design system.
- Contraste corrigido nos índices, valores pendentes e símbolos da comparação.
- Tabela com região nomeada, foco visível e rolagem horizontal por teclado no desktop.
- Parallax dos pilares em CSS, sem importar Motion na landing. Continua opcional:
  sem suporte ou com movimento reduzido, a imagem fica visível e estática.
  Referência: [MDN — animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline).

## Medição controlada

Lighthouse local, build de produção, configuração mobile padrão, três execuções seriais
por versão. Base `de14a8991b2d7a90e976f6696c7eb718fc693270`. Servidor em `localhost:3120`.
Medição final sem concorrência de build, testes ou outras auditorias.

| Medida                   | Antes           | Depois          |
| ------------------------ | --------------- | --------------- |
| Performance (três notas) | 87 / 89 / 89    | 90 / 90 / 90    |
| Acessibilidade           | 97 / 97 / 97    | 100 / 100 / 100 |
| Boas práticas            | 100 / 100 / 100 | 100 / 100 / 100 |
| LCP, mediana             | 3,621 s         | 3,446 s         |
| JavaScript transferido   | 210.866 bytes   | 165.338 bytes   |
| CLS                      | 0,01659         | 0,01687         |

Resultado mais robusto: **45.528 bytes a menos de JavaScript (21,6%)**. A melhora de
LCP foi pequena (4,8%); remover apenas a cascata não trouxe ganho consistente na nota.
O layout permaneceu estável. CSS bloqueante e fontes continuam limitando o LCP simulado.
Não são métricas reais de usuários nem garantia de velocidade em produção.

## Regressões cobertas

`e2e/apresentacao.spec.ts` cobre desktop e WebKit mobile: conteúdo inicial, destinos
dos CTAs, âncoras, contraste WCAG A/AA, fonte das notas, largura da página, foco da
tabela, suporte progressivo e mudança de preferência de movimento. Em build de produção,
também valida HTML e âncoras com JavaScript desligado.

Resultados locais: 659 testes unitários aprovados (4 pulados preexistentes),
224 cenários E2E aprovados num servidor limpo (6 pulados, incluindo 2 exclusivos
de produção) e 8 testes direcionados aprovados no build de produção. Gates de
tipagem, lint, formatação, identidade, fronteira, DS e schema aprovados; `/` estática.

O teste de setas usa Chrome em janela estreita; a emulação touch do iOS não executa a
rolagem nativa por teclado físico. Nela verificamos foco e semântica, sem simular sucesso.

Verificação visual realizada em 1280 × 720 e 390 × 844. Todas as imagens, ofertas e
declarações comerciais existentes foram preservadas; sua validação editorial não faz
parte deste ajuste e não deve ser inferida destas notas.

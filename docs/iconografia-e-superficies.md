# Ícones de áreas e superfícies do Subido

## Material

Branco `--via-white`, cinza frio `--via-gray-50` e tinta `--via-navy`.
O fundo principal usa `--app-canvas-bg`. Cards usam `--app-glass-plane` ou
`--app-glass-plane-strong`, com base neutra explícita e reflexo interno.
Menus usam `--app-shell-overlay-bg`, opaco para preservar a leitura.

O blur estrutural fica em `--app-glass-filter`, com saturação de 100%.
Não acrescentar bege, filtros sépia, brilhos dourados ou saturação elevada para
simular vidro. A fonte vendorizada continua intacta; os papéis ficam em `brand.css`.

## Pictogramas de áreas

`IconeProduto` contém os 15 desenhos das áreas do produto. Início, navegação lateral,
dock e Sobral AI usam a mesma família. Os ícones não substituem o logo Subido.

- Grade de 24 unidades, traço de 1.65 e cor herdada por `currentColor`.
- Recortes diagonais, cantos suaves e segundo plano na mesma cor, com 8–10% de tinta.
- Navegação: 22px. Cards do Início: 30px. Metadados do chat: 20px.
- Em fundo navy, o pai define tinta branca. Sem opacidade no desenho inteiro.
- Sem caixas clicáveis dentro de cards clicáveis. O ícone identifica; o card navega.
- SVG decorativo, sem foco: o nome acessível pertence ao link ou botão.
- Exportar elementos já renderizados nos mapas de navegação, não referências de componentes.

Setas, fechar, copiar, busca dentro de campo e controles de áudio continuam no Lucide.
Essas ações preservam convenções conhecidas; a assinatura própria fica nas áreas.

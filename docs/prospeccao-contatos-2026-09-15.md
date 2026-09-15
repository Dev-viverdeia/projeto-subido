# Prospecção: contato em primeiro plano

## Direção visual

Empresa → contato → ação. O card deve permitir começar uma abordagem ou abrir a ficha sem virar um dossiê em miniatura.

Paleta existente, sempre aplicada por tokens: branco `#FFFFFF`, fundo frio `#F7F8FA`, navy `#0A1F3B`, navy profundo `#02162A`, azul `#1E3A5F`, texto secundário `#4F596B`. Geist para leitura; sem números decorativos ou etiquetas em caixa alta. Nome em 20 px, contatos em 16 px, apoio e ações em 14 px ou mais.

```text
Empresa
Categoria · região

[canal + contato completo                 ↗] [copiar]
[canal + contato alternativo              ↗] [copiar]
Possível contato: pessoa · cargo (se houver)

Projeto para validar: sugestão (se houver)
Ver detalhes                  Criar oportunidade
```

- Uma superfície de vidro clara; contatos agrupados, sem pilhas de cards menores.
- Uma empresa por linha. Quando há largura, identidade e contatos ficam lado a lado; no celular, empilhados. A revisão visual descartou duas colunas de cards porque comprimiam e-mails e criavam grandes vazios nas empresas com poucos dados.
- Remover completude e responsável vazio da lista. Origem, confiança, endereço e todos os canais continuam nos detalhes.
- Dois canais acionáveis, com preferência pelo canal sugerido quando disponível; nunca inventar um contato para preencher espaço.
- Celular com valores quebrando linha, alvos de 44 px e ações que se acomodam sem corte.
- Movimento curto apenas como resposta à interação; teclado, foco de retorno, modo sem movimento e fallback sem blur preservados.

## Limite do bloco

Somente apresentação dos resultados. Sem novas dependências, alterações de créditos, busca, enriquecimento, banco ou envio automático ao CRM. Testes usam empresas fictícias; a conferência em produção é somente de leitura.

## Validação local

Contatos disponíveis e ausentes, canal sugerido, redes sociais, empresas já em Vendas, nomes e e-mails longos, copiar sem registrar abordagem, abertura/fechamento do dossiê, desktop/celular/teclado e acessibilidade. Gates completos antes da publicação.

- 1.833 testes unitários passaram; 34 testes previamente ignorados permaneceram assim.
- Nove cenários novos de interface em Chromium, WebKit e Firefox, com larguras de 320 a 1.440 px. Seis cenários existentes de dossiê e retomada também passaram.
- Axe sem violações no recorte dos cards; controles com área mínima de 44 px; conteúdo dos contatos em 16 px sem reticências.
- Typecheck, lint, formatação, tokens, fronteira cliente/servidor e integridade do DS passaram. O cache local antigo do DS estava inválido; uma cópia temporária nova confirmou os mesmos 108 arquivos do upstream, sem mudar o fornecedor ou o gate.
- Conferência visual local em desktop e celular. Produção conferida inicialmente somente em leitura, sem novas buscas, créditos ou contatos.

## Próximo bloco sugerido

Retomada de Prospecção: voltar de uma ficha para a mesma lista, empresa e posição, mantendo contexto sem refazer a navegação. É continuidade de uso, não mais campos no card.

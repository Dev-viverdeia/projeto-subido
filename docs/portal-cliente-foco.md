# Portal do cliente · decisões e materiais

## Direção

O cliente precisa reconhecer seu projeto, revisar o que depende dele e encontrar os arquivos. Não precisa aprender um sistema de gestão.

- Branco `#FFFFFF`: planos de conteúdo.
- Névoa `#F7F8FA`: fundo frio.
- Marinho `#0A1F3B`: títulos, foco e ação principal.
- Profundo `#02162A`: contraste reservado às ações.
- Ardósia `#475569`: apoio legível.

Geist para títulos, texto e controles; números apenas quando representam quantidade real. Tokens existentes, sem alterar o DS gerado. Superfícies de vidro discretas, bordas finas e luz branca; sem círculos, amarelo ou grandes painéis escuros.

```text
Marca                                      Acesso protegido
Empresa / Projeto                         Status real
Fases                                      Arquivos ↓

O que precisa de resposta
▾ Entrega / mudança selecionada
  Material · critério / impacto · decisão
▸ Próxima revisão
Acesso ou pendência simples               Confirmar

Arquivos do projeto                       Suporte
Entregas compartilhadas
Sobre o projeto · Resultados e aceite · Histórico
```

## Revisão do plano

- Uma revisão: aparece aberta, sem clique extra. Várias: primeira aberta e demais recolhidas, sem desmontar formulários nem perder o ajuste digitado.
- Pendências simples continuam diretamente acionáveis; não esconder um botão atrás de outra ação desnecessária.
- Atalho para arquivos evita atravessar toda a fila de revisões.
- Aprovações e impactos de escopo continuam explícitos. Conclusão manual não vira aceite do cliente.
- Reutilizar o modal operacional para pedir mudança: portal no body, foco contido, Escape, rolagem e bloqueio durante envio.
- Não criar nova estrutura de dados, upload, automação ou etapas. Somente conteúdo já autorizado no portal.

## Validação

Desktop e celular; revisão única e múltipla, ajuste preservado, impacto financeiro, arquivos, vazio, conclusão manual, teclado, contraste e movimento reduzido. As simulações locais não enviam decisões para clientes reais. Rotas de preview permanecem indisponíveis em produção.

### Links diretos das notificações

O fragmento `#entrega-…` faz o navegador revelar o `details` ancestral antes da hidratação. Esse estado é nativo e deve ser preservado, inclusive na busca da página. A exceção `suppressHydrationWarning` fica somente no elemento `details`, não no conteúdo nem na página: não alteramos HTML, aprovação ou dados para contornar o aviso. Referências: [revelação de fragmentos no HTML](https://html.spec.whatwg.org/dev/browsing-the-web.html) e [atributo específico no React](https://react.dev/reference/react-dom/components/common).

O teste captura erros de console e de página, abre o link direto, interage com o formulário, recolhe/reabre a revisão e verifica que o texto foi mantido. Antes da correção, falhou em Chromium e WebKit pelo atributo `open` alterado pelo navegador.

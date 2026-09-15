# Edição do contato principal

## Composição

Usar a ficha existente, sem uma nova página. A ação fica em Contatos e abre o
ModalOperacao em portal. Uma coluna, três campos e um único botão primário.

```text
Contatos                       Editar contato

       Contato principal                 ×
       Nome
       [                            ]
       Telefone
       [                            ]
       E-mail
       [                            ]
                  Cancelar   Salvar alterações
```

Paleta canônica: branco #FFFFFF, superfície #F7F8FA, tinta #0A1F3B,
navy profundo #02162A e azul #1E3A5F. O código consome tokens, não hex.
Geist, corpo de 16px, controles de pelo menos 44px. Vidro e bordas do modal
compartilhado; sem decoração, nova tipografia ou texto comercial.

## Comportamento

- Salvar nome, telefone e e-mail do contato principal, inclusive quando não existe.
- Nome opcional para quem só conhece o canal; sem inventar uma pessoa.
- Cancelar não grava. Erros preservam campos. Durante a gravação, impedir repetição.
- Contatos compartilhados atualizam suas fichas; convites já enviados não mudam.
- Não executar enriquecimento, descontar créditos nem mover a venda.
- Transação com isolamento por dono, plano atual e revisão contra sobrescrita.
- Telefone corrigido manualmente não volta a ser ocultado pelo extrator antigo.
- Dados importados e o histórico anterior são preservados.

## Validação

Testes de campos, sessão, plano, conflitos, criação, limpeza e canais curados.
Modal em desktop/celular, teclado, contraste, erros, loading e cancelamento.
CI integral antes de merge e publicação; leitura da ficha pública depois.

Validação local concluída: 1.940 testes unitários, 21 testes de interface em
Chromium, Firefox e WebKit mobile, análise de acessibilidade e contratos em
Postgres descartável (permissões, edição concorrente, criação e idempotência).
Typecheck, lint, formatação, tokens do design system e fronteiras de servidor
também conferidos. Conferência visual em 1280 × 720 e 390 × 844.

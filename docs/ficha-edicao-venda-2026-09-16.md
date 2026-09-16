# Edição da venda na ficha

## Direção visual

Geist, superfícies claras e vidro do design system. Paleta existente: #0A1F3B,
#02162A, #1E3A5F, #FFFFFF e #F7F8FA, sempre consumida por tokens.
Nada de novos painéis, números decorativos ou etapas.

```text
Empresa
Nome do projeto
Valor previsto · R$ 12.500,00    [Editar venda]

Modal: Editar venda
Nome do projeto [________________]
Valor previsto (R$) [____________]
                 [Cancelar] [Salvar alterações]
```

O valor vazio significa “A definir”, diferente de zero. O formulário preserva
o rascunho em falhas, informa conflitos, impede envio duplo e devolve o foco.
Usa o modal em portal, controles de pelo menos 44px e os mesmos campos da
edição de contato/empresa. O contexto não depende de texto pequeno ou tooltip.

## Contrato

- Apenas título e valor da oportunidade; sem alterar etapa, empresa, contato,
  propostas existentes, entregas, convites, pesquisa ou créditos.
- Autorização atual de Vendas no servidor e novamente no banco.
- Revisão específica dos campos comerciais, inclusive em atualizações externas;
  mudanças de próxima ação não geram conflitos desnecessários.
- Operação atômica com histórico dos campos alterados e nenhuma escrita em no-op.
- Atualizar ficha, kanban, métricas e contexto que lê a oportunidade.

## Verificação prevista

Validação monetária, autorização, concorrência em PostgreSQL descartável,
fluxos de erro/sucesso/cancelamento, foco, acessibilidade e telas pequenas.
Publicação condicionada aos gates completos do repositório.

## Resultados locais

- 2.017 testes unitários aprovados; 34 skips já existentes.
- 6 cenários novos de interface aprovados (Chromium, WebKit mobile e Firefox),
  com validação axe do modal e sem erro de hidratação.
- Concorrência real no PostgreSQL: quatro gravações para a mesma revisão,
  somente uma aceita. Sem acesso entre contas ou pelo plano Starter.
- Conferência visual do modal em desktop e 390 × 844; campos de 16px e
  botões de pelo menos 44px, ações acessíveis dentro da viewport.
- O kanban preserva os centavos, inclusive o zero final, sem acrescentar
  casas decimais a valores inteiros.

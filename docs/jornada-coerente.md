# Jornada coerente — Vendas

## Decisão

Uma etapa registrada, a mesma no quadro e na ficha. Enriquecimento, reunião e proposta são fatos do cliente, não etapas automaticamente concluídas. A próxima ação definida pelo usuário não será substituída por uma sugestão. Propostas continuam disponíveis sem reunião.

## Direção visual

Preservar Geist, superfícies brancas translúcidas, bordas finas e sombras do design system. Paleta de referência: branco #FFFFFF, off-white #F6F7F9, navy #0B203D, ink #02172A, texto secundário #536079; a implementação usa exclusivamente os tokens existentes, sem redefini-los. Títulos usam a escala de página/seção, controles a escala UI e metadados a escala de suporte; mono só em números.

Alternativas consideradas:

- Cinco etapas misturando venda e entrega: rejeitada; contradiz o quadro e sugere progresso não registrado.
- Mais cards para cada fato: rejeitada; aumenta a carga de leitura.
- Quatro etapas compactas + uma próxima ação: escolhida. A entrega tem estado próprio, acessível pelo mesmo documento existente.

Composição:

    Empresa                       Etapa registrada · Mais ações
    Contato · localização         Reunião / proposta / dados
    Preparar — Descobrir — Propor — Ganho
    Próxima ação definida OU sugestão                  Ação
    Histórico (fechado)

No quadro, mostrar as quatro colunas quando houver largura útil suficiente. Em telas menores, navegação por etapa sem scroll horizontal da página. No mobile, controles legíveis, sem reduzir texto para caber.

## Critérios de aceite

- Cabeçalho, progresso e Kanban usam a etapa persistida, inclusive com enriquecimento ou proposta offline.
- Uma proposta recusada não encerra uma venda reaberta. Arquivadas/desclassificadas não têm ações ativas.
- Propostas existentes são retomadas; aceitas levam à preparação da entrega; entregas existentes não são recriadas.
- A próxima reunião é a mais próxima entre as que podem abrir; um compromisso sem reunião não aponta para a própria ficha.
- Iniciar uma entrega atualiza também as telas de vendas. Mantém-se a operação idempotente existente.
- Testes unitários, navegador desktop/mobile e inspeção visual antes da publicação. Sem consumir créditos, enviar convites ou alterar dados de clientes nos testes.

## Verificação da implementação

A conferência visual em 1440 × 900 manteve os quatro títulos de coluna alinhados, a próxima ação acessível abaixo de um cabeçalho reduzido e um único destaque navy. Em 390 × 844, os controles mantêm altura e texto legíveis, sem overflow da página. O cartão de etapa perde a moldura extra no celular. O formulário devolve o foco ao gatilho após fechar e usa o autofocus do modal, sem antecipar a captura de foco.

A revalidação usa a rota interna `/crm`, conforme a documentação local do Next para rewrites; o endereço do usuário continua `/vendas`. A criação de entrega reutiliza `projeto_iniciar`, cuja função de banco trata conflito pelo identificador da proposta. Não houve mudança de schema, crédito ou registro real.

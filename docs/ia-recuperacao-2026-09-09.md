# Recuperação de enriquecimento e Sobral AI

## Entrega

- Enriquecimento consulta a última análise antes de solicitar outra. Uma análise ativa é reutilizada, sem novo pedido ao worker.
- Se a confirmação do pedido se perder, o modal oferece **Conferir andamento**. A consulta usa sessão/RLS, não chama IA nem reserva créditos.
- A análise anterior é guardada como referência: um resultado antigo nunca confirma um pedido novo. Resultado ausente ou leitura indisponível mantém o estado incerto, sem repetição automática.
- O modal diferencia confirmação pendente, análise em andamento, encerrada e pronta. A ficha continua sendo a fonte do resultado final.
- Sobral diferencia geração de resposta de conferência do resultado salvo. Reabrir uma conversa pendente consulta o recibo; não gera novamente por conta própria.
- Conflito de geração (409) consulta o recibo existente. Sessão expirada oferece login em outra aba e conferência da mesma pergunta.
- Pergunta, áudio e resposta parcial permanecem na conversa durante a recuperação. Envio de arquivos mantém o protocolo existente de retomada e confirmação.
- Ajuda contextual abre em outra aba, levando somente rota permitida e assunto conhecido. Não inclui texto da conversa, anexos, query original ou erro bruto.
- Interface usa o componente de recuperação do design system do aplicativo: vidro claro, navy, foco visível, ações curtas e sem progresso fictício. O erro acompanha a leitura antes da pintura para não ocultar os controles atrás do compositor no celular.

## Validação

- Testes unitários de consulta RLS, confirmação incerta, referência anterior, bloqueio simultâneo, recuperação de resposta, sessão e preservação de parcial.
- Regressão Playwright de IA, anexos/áudio, enriquecimento, suporte e recuperação contextual. Desktop e celular; também 320px/768px, teclado e movimento reduzido.
- Nos cenários de confirmação perdida, o teste verifica exatamente um POST; a retomada só faz leituras. AXE WCAG A/AA verifica os componentes novos.
- Simulações locais de rede não chamam modelos externos nem usam créditos reais. Não equivalem a um teste da qualidade do modelo ou de disponibilidade de cada provedor.

## Limites preservados

- Este bloco não cria persistência de rascunhos binários após fechar/recarregar a página.
- O primeiro cadastro de uma mensagem apenas de texto ainda usa o caminho existente; recibo transacional para essa primeira gravação é um próximo bloco separado.
- Não houve migração, alteração de política de créditos, de modelo ou dos provedores de enriquecimento.
- Nenhum envio de e-mail, ticket, convite ou mensagem de cliente faz parte da validação.

# Sobral AI: ficha do cliente na orientação

## Entrega

- Resolve o nome completo da empresa citado pelo usuário, tolerando caixa, acentos e pontuação.
- Consulta a oportunidade correspondente: cadastro, pesquisa concluída, notas, análises de reuniões, propostas, entregas e tarefas pendentes da execução.
- Usa objetivos, escopo, investimento e cronograma registrados, preservando o status do documento.
- Não escolhe a oportunidade mais recente quando há mais de uma. Pede a escolha; a resposta curta com o título retoma a ficha.
- Não leva o foco comercial automático para dúvidas gerais ou outro cliente. Só retoma referências explícitas a um cliente mencionado pelo usuário.
- Fichas arquivadas/ganhas podem ser consultadas, mas não originam uma tarefa comercial automática.
- Recibo discreto e recolhido mostra a ficha consultada, fontes, datas e link interno. Ele descreve a leitura do servidor, não afirma que o modelo citou todos os dados.
- Leitura parcial recebe aviso na resposta e no recibo. Ausência de resultado não é apresentada como prova de inexistência.

## Limites deliberados

Sem nova pesquisa de enriquecimento, novo agente, vetorização ou migração de banco. Reaproveita os registros existentes e a mesma geração de IA, com o limite mensal já aplicado ao Sobral.

A seleção é conservadora: nome completo, sem inferir empresa por segmento ou trecho aproximado. Examina até 500 nomes recentes da conta e 21 oportunidades da empresa; acima de 20, pede esclarecimento. Referências conversacionais são limitadas às seis últimas mensagens do usuário e não atravessam mudanças de assunto.

Cada domínio tem teto de consulta. O resumo enviado ao modelo tem até 32 trechos de 500 caracteres e reserva espaço para todas as fontes presentes. Não representa o histórico integral. Não envia e-mails, telefones, URLs privadas do portal, transcrições integrais nem objetos brutos do banco. Datas de pesquisas e a distinção registro/hipótese acompanham os trechos.

## Proteções

- Cliente Supabase autenticado + RLS; filtro explícito por dono em todas as consultas novas.
- Consultas filhas limitadas à oportunidade, às reuniões ou às entregas já selecionadas.
- IDs de destino e recibo vêm do servidor, nunca da saída do modelo.
- Dados livres continuam no bloco de referência, fora das instruções de prioridade.
- Confirmação para qualquer tarefa comercial; nenhuma mensagem, proposta ou reunião é enviada/criada automaticamente.
- Falhas de leitura e JSON incompatível não viram uma falsa ficha vazia.
- Contratos anteriores de mensagens e planos continuam legíveis: campos novos são opcionais.

## Verificação

- Testes unitários: seleção, homônimos, nomes parciais/descartados, mudança de cliente, retomada, escolha por título, autorização das consultas, erros parciais, orçamento de trechos e separação entre fatos/hipóteses.
- Testes de interface: Chromium desktop e WebKit mobile; teclado, foco, rascunho preservado, fonte legível, link da ficha e ausência de transbordamento.
- 10 cenários anteriores de IA e seis novos com ficha fictícia. Na primeira rodada, a IA omitiu o aviso de leitura parcial; corrigido com instrução operacional derivada do estado do servidor e aviso independente no recibo. Nova rodada dos seis passou.
- A leitura humana da primeira rodada pública encontrou uma abordagem com “vi que vocês” sem registro que sustentasse essa observação. A orientação passou a proibir observações ou combinados inventados quando há apenas nome e título da oportunidade. Dois cenários adicionais cobrem fichas esparsas, e a validação pública também verifica esse caso.
- Validação integrada usa contas e registros fictícios, IA real, formulário real de proposta sem reunião, entrega recorrente e ambiguidade. Uma segunda conta homônima testa isolamento. Gerações limitadas e todas as contas são removidas por ID/identidade conferidos.
- 94 verificações de navegador passaram, incluindo arquivos, áudios, buscas, histórico, salvas, rascunhos e recuperação.
- Landing preservada estática. Lighthouse local: performance 90, acessibilidade 100, boas práticas 100. Resultado de laboratório da landing, não nota de toda a aplicação.

O recibo visual foi conferido em desktop e celular. A publicação exige CI no SHA exato, produção READY e conferência do domínio, seguida da repetição dos cenários autenticados.

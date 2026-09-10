# Sobral AI: do material à ficha

Uma nota revisada, não uma automação da entrega.

## Experiência

- Áudio, documento ou imagem novos podem gerar um resumo na mesma resposta da IA.
- Convite compacto na conversa; a revisão usa o modal padrão do produto.
- Escopo visível, demais seções expansíveis. Campos desconhecidos permanecem vazios.
- A pessoa escolhe a ficha, edita e confirma. Alterar texto ou ficha desmarca a confirmação.
- Fechar preserva a edição enquanto a conversa permanece aberta. Recarregar recupera o resumo original, não edições ainda não salvas.
- Depois de salvar, o link abre o registro exato na ficha. Funciona também para notas que saíram das atividades recentes.

## Limites

- Uma nota por resposta, com origem derivada dos anexos reais daquela rodada.
- Não cria tarefas, não muda etapa, prazo, próxima ação, proposta ou aceite.
- Não envia e-mail, WhatsApp, convite ou mensagem ao cliente.
- Não faz uma nova chamada de IA ao revisar ou salvar. O processamento inicial segue o consumo normal do Sobral.
- Starter continua analisando materiais; salvar na ficha exige plano com Vendas.
- A lista apresenta até 300 fichas mais recentemente atualizadas, inclusive encerradas. Não reabre fichas.
- Anexos continuam privados. A nota contém o resumo revisado e referências, não uma cópia pública do arquivo.
- Materiais sem informações pertinentes ao projeto/cliente não geram o convite.

## Segurança e recuperação

Server Action e RPC validam usuário atual e plano. A RPC autoriza mensagem, conversa,
geração concluída, anexos da pergunta original e ficha do mesmo dono. Repetir o mesmo
pedido retorna o recibo existente; alterar conteúdo ou destino após salvar retorna conflito.
Um índice único e lock da resposta evitam duplicidade em chamadas concorrentes.

## Acabamento

Geist, tokens cool-white/navy existentes, card liquidglass discreto. Controles de 44 px,
contraste, foco, portal, rolagem interna do modal e rodapé acessível no celular. Copy separa
claramente análise, revisão e registro. Sem nova sidebar, badge permanente ou hero.

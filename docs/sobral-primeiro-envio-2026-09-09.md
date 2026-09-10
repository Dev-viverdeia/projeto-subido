# Sobral AI: confirmação do primeiro envio

## Escopo

Texto sem anexos, em conversa nova ou existente. Falha de rede antes da confirmação não cria outra tentativa. Anexos continuam no protocolo de upload retomável existente.

## Comportamento

- Conversa e primeira pergunta são salvas na mesma transação (`sobral_confirmar_texto`).
- UUIDs da conversa e da pergunta nascem antes do POST e permanecem na tentativa aberta.
- Repetir o mesmo UUID e conteúdo devolve o mesmo recibo. Conteúdo, conversa ou anexos diferentes falham sem sobrescrever nada.
- A função é `security invoker`, com `search_path` vazio, permissão apenas para `authenticated` e RLS das tabelas. Não recebe dono do navegador.
- Ao perder o ACK, a pergunta permanece visível e a edição fica suspensa. “Conferir envio” consulta a mensagem exata; uma consulta com erro nunca equivale a ausência.
- Se não houver confirmação, “Retomar envio” reutiliza os mesmos UUIDs. Uma gravação atrasada também encontra o mesmo recibo.
- Depois de confirmar o registro, a ação explícita do usuário continua o fluxo de resposta existente. Reconectar a rede não dispara envio ou geração automaticamente.
- A tentativa fica vinculada à mesma conta. O JWT dessa sessão é fixado na requisição, evitando troca de conta entre a conferência local e o pedido. A autorização efetiva permanece no servidor e na RLS.
- O SDK continua fora do carregamento inicial. POST e consulta de confirmação têm timeout de 15 segundos.

## Experiência

Reutiliza o card de recuperação e os tokens do design system. No celular, o compositor desabilitado deixa de ocupar o espaço da recuperação. Foco vai para o aviso após uma falha; a ação permanece acessível por teclado. Nenhum painel ou configuração nova.

## Validação local

- 1.247 testes unitários aprovados; 12 ignorados preexistentes.
- 62 cenários Playwright aprovados em Chromium desktop e WebKit móvel, incluindo regressões de suporte, áudio, enriquecimento e recuperação. Casos existentes incluem 320/768px e movimento reduzido.
- AXE AA sem violações no card de recuperação; capturas desktop e móvel inspecionadas.
- PostgreSQL 17 descartável: 20 pedidos simultâneos geram uma conversa e uma pergunta. Testados isolamento de conta, ausência de sessão, conflito de conteúdo/conversa/anexo, rollback e pergunta durante geração.
- Contratos existentes de concorrência/recuperação mantidos.
- Build local autenticado contra o banco real: ACK perdido antes/depois do commit recuperado, uma mensagem por conversa, dono correto, zero gerações. Conta temporária e suas conversas removidas; nenhuma conta de cliente alterada.
- Build aprovado, `/` permanece estática. Quatro avisos AVIF preexistentes.
- Lighthouse mobile local da landing: desempenho 88, acessibilidade 100, boas práticas 100, CLS 0,017. Referência de laboratório; não é nota da área logada. Nenhum arquivo da landing foi alterado neste bloco; não há orçamento Lighthouse versionado no repositório.

## Limites e publicação

O recibo e o texto ainda não são um rascunho persistente após fechar a aba. `beforeunload` é um aviso de melhor esforço; a interface pede manter a aba aberta até confirmar. Não grava perguntas, anexos ou credenciais no armazenamento do navegador. Rascunhos retomáveis após fechar/reabrir ficam para outro bloco.

A migração aditiva `20260910010552_sobral_confirmar_texto` está aplicada; `anon` sem acesso, `authenticated` com execução e RLS preservada. Não altera mensagens antigas. A publicação do front-end exige CI aprovado no SHA exato, release confirmado no domínio e teste autenticado isolado. O teste real deve bloquear IA/e-mails/tickets e remover somente sua conta temporária ao terminar.

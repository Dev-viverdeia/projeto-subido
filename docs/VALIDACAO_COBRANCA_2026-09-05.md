# Conta, cobrança e permissões

## Entrega

- Plano e créditos em uma leitura curta: acesso atual, situação da assinatura, ação e saldo.
- Carteira com custos, extrato e pacotes; erro de consulta não é apresentado como saldo zero ou extrato vazio.
- Retorno do checkout distingue consulta, atualização, confirmação, pendência, expiração, falha e reembolso. Espera limitada, recuperação manual e suporte; sem loading indefinido.
- Uma URL com `checkout=sucesso` não confirma compra. O servidor exige sessão Stripe válida, autenticação, duas referências de propriedade e confirmação do webhook no banco.
- Preços consultados novamente antes da compra. Catálogo atual aceita BRL, planos mensais de preço fixo e pacotes avulsos; preços inativos ou incompatíveis não são oferecidos.
- Assinaturas gerenciáveis, inclusive inadimplentes e incompletas, seguem para o portal em vez de iniciar uma assinatura nova.

## Segurança: correção delimitada

O plano ausente assumia Pro. O guard do servidor e a RPC de enriquecimento também confiavam no plano de um JWT anterior a alterações de assinatura.

Agora o fallback é Starter. O servidor consulta o usuário atual no Auth; no banco, `plano_subido_atual()` consulta somente o usuário de `auth.uid()`, sem aceitar um identificador fornecido pelo cliente. A RPC mantém os vínculos por dono e a reserva transacional. O INSERT direto de enriquecimento foi revogado. Reuniões/Live Coach continuam disponíveis no Starter, com a mesma fonte atual de autorização.

Migration: `20260905214500_plano_atual_cobranca_segura.sql`. Aplicada e validada sem alterar planos, saldos ou registros das contas reais.

Reprodução anterior, em transação: dono Starter com claim Pro antigo e oportunidade inexistente chegava à consulta da oportunidade (`P0002`), ultrapassando o bloqueio de plano. Após a correção, recebe `42501/recurso_indisponivel_no_plano`. Controle inverso: dono realmente Pro com claim Starter ainda chega a `P0002`. Ausência de sessão foi rejeitada; privilégio INSERT direto está desabilitado. Nenhuma chamada desses controles criou execução ou debitou créditos.

Investigação prévia e revisão independente posterior executadas. Revisor: 44 testes aprovados, sem novo bypass identificado no perímetro corrigido.

## Verificações

- 765 testes unitários aprovados; 4 pulados preexistentes.
- 290 cenários E2E aprovados, 8 pulados; Chrome desktop e WebKit mobile. O novo conjunto de cobrança tem 8 cenários, incluindo contraste, foco, largura e retorno de pagamento.
- Typecheck, lint, formatação, identidade, fronteira client/server, lockfile, integridade do DS (108 arquivos) e build aprovados. Landing estática preservada.
- Conta descartável autenticada: telas reais em 1440 × 1000 e 390 × 844, sem overflow ou erro de renderização. Nenhuma assinatura/pedido/checkout criado; conta removida ao final.
- Script reproduzível: `node scripts/smoke-cobranca.mjs --confirmar-teste`, com ambiente Supabase apropriado. `SUBIDO_APP_URL` permite localhost ou o domínio público. Nunca imprimir credenciais.

## Não confundir com operação financeira pronta

Na consulta atual, o projeto Vercel não possui variáveis `STRIPE_*` e não há assinaturas, pedidos ou eventos de webhook registrados. Contratação permanece desabilitada. Não foram criados preços nem conectada uma conta de outro produto. Fluxos Stripe são testados com fronteiras simuladas; pagamento real, estorno financeiro e atualização por webhook não foram exercitados de ponta a ponta neste bloco.

Antes de habilitar cobrança real em escala, ainda é necessário concluir a revisão das permissões do processamento de enriquecimento e dos estornos. Este bloco não certifica toda a operação financeira. Os detalhes técnicos remanescentes ficam no relatório privado de segurança.

A idempotência existente do checkout usa janelas de um minuto. Não é uma garantia de exclusão mútua entre compras concorrentes em janelas distintas. A ativação comercial também deve validar esse caso com Stripe em modo de teste, preços aprovados e webhooks reais.

# Recuperação com ajuda contextual

## Entrega

Orientação no ponto da falha em quatro fluxos: conectar a agenda, agendar reunião,
criar proposta e gerenciar a entrega. A página de erro geral também oferece suporte.

- Quadro compacto de recuperação com ação pertinente, guia e pedido de ajuda.
  Tokens existentes, superfície clara, contraste e alvos de toque de 44 px.
- Falha de conexão não desmonta o agendamento nem apaga os campos enviados.
  Na proposta, o reset nativo do formulário não pode apagar os seletores após
  a resposta de erro. Na entrega, a confirmação permanece marcada.
- Quando o resultado do envio é incerto, a orientação é conferir reuniões,
  propostas ou dados atuais antes de repetir. Não há repetição automática da ação.
- Sessão expirada no agendamento e na gestão da entrega oferece acesso em outra aba.
  Reconectar a agenda mantém a navegação OAuth e o rascunho já existentes.
- Conflito de versão na entrega oferece atualização dos dados, sem reenviar a ação.
- Guia e suporte abrem em outra aba. O pedido recebe assunto e categoria sugeridos
  pela área; um rascunho já escrito pelo usuário tem prioridade sobre o assunto sugerido.
- O link de ajuda contém somente contexto permitido e rota sem parâmetros ou
  fragmentos. Não inclui conteúdo dos campos, e-mail do cliente ou erro técnico.
- A tela da agenda não exibe mais o erro cru do provedor. Nenhuma alteração no OAuth.

## Validação

- 1.214 testes unitários aprovados; 12 já ignorados. O contrato de conflito e sessão
  da entrega também foi reexecutado após o refinamento dos testes.
- 68 cenários Playwright aprovados em computador e celular. Dez cobrem especificamente
  falha de rede, persistência dos campos, contexto seguro e respeito ao rascunho.
  Os envios foram interrompidos no navegador: nenhum convite, proposta ou entrega real
  foi criado por esses testes. Atualizar uma entrega não disparou outro POST.
- Sem violações axe A/AA nos quatro estados de recuperação testados. Verificação
  visual adicional da proposta em 320, 390, 768 e 1440 px, movimento reduzido,
  foco no aviso e ausência de rolagem horizontal.
- Typecheck, lint, formatação, identidade, fronteira client/server, integridade do DS
  e lockfile aprovados. Build concluído, landing estática, quatro avisos AVIF anteriores.
- Previews continuam indisponíveis em produção. Guias seguem usando o catálogo existente.
- Lighthouse mobile no guia público de atendimento, build local de produção:
  performance 95, acessibilidade 100, boas práticas 100, CLS 0. Medição de laboratório
  da ajuda pública; não representa desempenho de campo de todos os formulários logados.

## Limites

Não muda permissões, cobrança, créditos, aprovação do Google ou processamento de e-mail.
Não oferece garantia de execução única para toda a plataforma: a recuperação evita
repetir silenciosamente uma operação cujo resultado não foi confirmado.
Manter campos após falha de rede na mesma tela não equivale a um rascunho persistente
entre dispositivos. O comportamento de redirecionamento de autenticação da criação de
proposta continua existente; não é substituído por uma mensagem genérica de conexão.

## Próximo bloco recomendado

Estender a recuperação ao enriquecimento e ao Sobral AI: andamento claro, retorno ao
resultado e ajuda contextual, preservando mensagem/anexos e conferindo a operação antes
de qualquer nova execução com consumo de créditos. Reutilizar os estados reais existentes.

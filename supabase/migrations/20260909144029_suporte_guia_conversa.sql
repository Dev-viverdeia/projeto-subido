insert into public.suporte_artigos (slug,titulo,categoria,resumo,passos,dica,destino,tags,publicado)
values ('pedir-e-acompanhar-ajuda','Pedir ajuda e acompanhar a resposta','outros',
  'Abra um pedido e continue a conversa pela plataforma ou pelo e-mail.',
  '["Na Central de ajuda, escolha Pedir ajuda. Conte o que você precisa resolver e o que aconteceu. Se ajudar, anexe um print sem senhas ou códigos.","Depois de enviar, guarde o número do atendimento. Em Meus atendimentos você acompanha a resposta e envia novas mensagens.","A resposta da equipe também chega por e-mail. Você pode responder à mensagem recebida para continuar no mesmo atendimento. Quando estiver tudo certo, marque como resolvido."]'::jsonb,
  'Sem conseguir entrar na conta? Use Ajuda na tela de entrada e confirme seu e-mail pelo link recebido. O suporte não consome créditos.',
  '/suporte/novo','suporte ajuda ticket atendimento responder email problema',false)
on conflict (slug) do nothing;

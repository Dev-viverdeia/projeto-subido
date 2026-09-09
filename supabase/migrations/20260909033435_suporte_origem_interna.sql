-- Apenas rotas internas reconhecidas podem aparecer como origem de um atendimento.
alter table public.suporte_atendimentos drop constraint suporte_atendimentos_pagina_check;
alter table public.suporte_atendimentos add constraint suporte_atendimentos_pagina_check
  check (pagina is null or (length(pagina) <= 180 and pagina ~ '^/(inicio|conta|vendas|prospeccao|propostas|reunioes|entregas|solucoes|formacoes|consultor|mentorias|certificados|suporte)(/[a-zA-Z0-9-]+)*$'));

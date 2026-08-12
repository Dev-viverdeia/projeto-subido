-- Uma reunião curta ou silenciosa não é falha de infraestrutura. Este estado
-- preserva a evidência sem induzir o profissional a procurar um erro técnico.
alter table public.calls_analises
  drop constraint calls_analises_status_valido;

alter table public.calls_analises
  add constraint calls_analises_status_valido
  check (status in ('pendente', 'processando', 'concluida', 'falhou', 'sem_conteudo'));

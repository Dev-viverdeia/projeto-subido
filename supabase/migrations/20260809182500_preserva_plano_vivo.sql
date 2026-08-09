-- O plano pertence à jornada do cliente. Remover uma sala ou uma call não pode
-- apagar o compromisso; apenas a referência operacional deixa de existir.

begin;

alter table public.projeto_acoes
  drop constraint projeto_acoes_execucao_fk,
  add constraint projeto_acoes_execucao_fk
    foreign key (dono, projeto_execucao_id)
    references public.projetos_execucao (dono, id)
    on delete set null (projeto_execucao_id);

alter table public.projeto_acoes
  drop constraint projeto_acoes_reuniao_fk,
  add constraint projeto_acoes_reuniao_fk
    foreign key (dono, reuniao_id)
    references public.calls_reunioes (dono, id)
    on delete set null (reuniao_id);

commit;

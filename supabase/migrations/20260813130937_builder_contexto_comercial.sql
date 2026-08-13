-- O Estúdio deixa de ser um gerador isolado e passa a guardar o contexto que
-- originou o projeto personalizado. Os vínculos são opcionais para preservar
-- os rascunhos legados, mas, quando presentes, precisam apontar para registros
-- que o próprio usuário consegue acessar.

alter table public.builder_solucoes
  add column oportunidade_id uuid
    references public.crm_oportunidades (id) on delete set null,
  add column projeto_base_id uuid
    references public.solucoes (id) on delete set null;

create index builder_solucoes_oportunidade_fk_idx
  on public.builder_solucoes (oportunidade_id);

create index builder_solucoes_projeto_base_fk_idx
  on public.builder_solucoes (projeto_base_id);

comment on column public.builder_solucoes.oportunidade_id is
  'Oportunidade do CRM que trouxe o contexto do cliente para este projeto personalizado.';

comment on column public.builder_solucoes.projeto_base_id is
  'Projeto padrão usado como ponto de partida para a personalização no Estúdio.';

-- A Edge Function usa o JWT do chamador e a RLS continua sendo a barreira.
-- Revalidar o vínculo aqui impede que uma chamada direta à Data API associe o
-- projeto privado a uma oportunidade de outra conta.
drop policy if exists "solução do builder criada pelo dono"
  on public.builder_solucoes;

create policy "solução do builder criada pelo dono"
  on public.builder_solucoes for insert
  to authenticated
  with check (
    (select auth.uid()) = dono
    and (
      oportunidade_id is null
      or oportunidade_id in (
        select oportunidade.id
        from public.crm_oportunidades oportunidade
        where oportunidade.dono = (select auth.uid())
      )
    )
    and (
      projeto_base_id is null
      or projeto_base_id in (
        select projeto.id
        from public.solucoes projeto
        where projeto.status = 'publicado'
      )
    )
  );

drop policy if exists "solução do builder alterada pelo dono"
  on public.builder_solucoes;

create policy "solução do builder alterada pelo dono"
  on public.builder_solucoes for update
  to authenticated
  using ((select auth.uid()) = dono)
  with check (
    (select auth.uid()) = dono
    and (
      oportunidade_id is null
      or oportunidade_id in (
        select oportunidade.id
        from public.crm_oportunidades oportunidade
        where oportunidade.dono = (select auth.uid())
      )
    )
    and (
      projeto_base_id is null
      or projeto_base_id in (
        select projeto.id
        from public.solucoes projeto
        where projeto.status = 'publicado'
      )
    )
  );

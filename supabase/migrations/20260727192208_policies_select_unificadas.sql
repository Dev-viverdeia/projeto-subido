-- =============================================================================
-- UMA POLICY PERMISSIVA POR (TABELA, PAPEL, AÇÃO)
--
-- Follow-up de 20260727191700. O linter de performance apontou
-- `multiple_permissive_policies` em profiles e user_roles.
--
-- O QUE ACONTECE COM DUAS POLICIES PERMISSIVAS NA MESMA AÇÃO
-- O Postgres avalia TODAS elas e combina o resultado com OR. Não há curto-circuito
-- em favor da mais barata: se uma delas chama `private.eh_admin()`, essa chamada
-- acontece em toda leitura, inclusive na de um membro comum que jamais passaria
-- pela regra de admin. Escrito como um OR dentro de uma policy só, o planejador
-- pode parar no primeiro ramo verdadeiro — e para o dono do registro, que é o
-- caso comum, o ramo barato `(select auth.uid()) = id` é o primeiro.
--
-- Em user_roles o problema vinha do `FOR ALL` da policy de admin: ALL inclui
-- SELECT, então ela concorria com a policy do dono em toda leitura. O Postgres não
-- tem "FOR ALL EXCEPT SELECT", então a de admin vira três policies de escrita.
-- Mais linhas de SQL, uma avaliação a menos por leitura.
-- =============================================================================

-- ---- profiles ---------------------------------------------------------------
drop policy "perfil visível para o dono" on public.profiles;
drop policy "perfil visível para admin" on public.profiles;

create policy "perfil visível para o dono ou admin"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id or private.eh_admin());

-- ---- user_roles -------------------------------------------------------------
drop policy "papéis visíveis para o dono" on public.user_roles;
drop policy "papéis administrados por admin" on public.user_roles;

create policy "papéis visíveis para o dono ou admin"
  on public.user_roles for select
  to authenticated
  using ((select auth.uid()) = user_id or private.eh_admin());

-- Escrita continua sendo só de admin. Separadas por ação justamente para não
-- reintroduzir uma segunda policy permissiva no SELECT.
create policy "papéis concedidos por admin"
  on public.user_roles for insert
  to authenticated
  with check (private.eh_admin());

create policy "papéis alterados por admin"
  on public.user_roles for update
  to authenticated
  using (private.eh_admin())
  with check (private.eh_admin());

create policy "papéis revogados por admin"
  on public.user_roles for delete
  to authenticated
  using (private.eh_admin());

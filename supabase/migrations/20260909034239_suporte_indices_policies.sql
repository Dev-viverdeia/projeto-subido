create index suporte_mensagens_autor on public.suporte_mensagens(autor);
create index suporte_eventos_autor on public.suporte_eventos(autor);
create index suporte_avaliacoes_dono on public.suporte_avaliacoes_artigos(dono);
-- Escrita administrativa separada da leitura, evitando avaliar duas policies de SELECT.
drop policy suporte_artigos_escrever on public.suporte_artigos;
create policy suporte_artigos_inserir on public.suporte_artigos for insert to authenticated with check ((select private.eh_admin()));
create policy suporte_artigos_atualizar on public.suporte_artigos for update to authenticated using ((select private.eh_admin())) with check ((select private.eh_admin()));
create policy suporte_artigos_excluir on public.suporte_artigos for delete to authenticated using ((select private.eh_admin()));
drop policy suporte_agentes_escrever on public.suporte_agentes;
create policy suporte_agentes_inserir on public.suporte_agentes for insert to authenticated with check ((select private.eh_admin()));
create policy suporte_agentes_atualizar on public.suporte_agentes for update to authenticated using ((select private.eh_admin())) with check ((select private.eh_admin()));
create policy suporte_agentes_excluir on public.suporte_agentes for delete to authenticated using ((select private.eh_admin()));

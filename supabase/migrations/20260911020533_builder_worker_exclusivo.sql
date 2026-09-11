-- Aplicar depois de provisionar a chave e publicar a Edge com o claim atômico.
begin;
-- RLS continua valendo. Status, respostas e resultados só pelo worker autenticado.
revoke insert,update on public.builder_solucoes from authenticated;
grant insert(id,dono,ideia_original,respostas,oportunidade_id,projeto_base_id) on public.builder_solucoes to authenticated;
grant update(stack) on public.builder_solucoes to authenticated;
commit;

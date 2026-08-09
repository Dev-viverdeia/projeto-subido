-- O roteiro guiado sempre usa `projeto_id`. Duas funcoes antigas ainda
-- consultavam o nome pre-renomeacao (`solucao_id`), o que impedia iniciar uma
-- entrega do catalogo e validar o progresso de suas etapas.

begin;

do $$
declare
  v_definicao text;
begin
  select pg_get_functiondef('public.projeto_iniciar(uuid)'::regprocedure)
    into v_definicao;
  execute replace(v_definicao, 'roteiro.solucao_id', 'roteiro.projeto_id');

  select pg_get_functiondef('private.progresso_validar_conteudo()'::regprocedure)
    into v_definicao;
  execute replace(v_definicao, 'r.solucao_id', 'r.projeto_id');
end;
$$;

commit;

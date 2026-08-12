-- O linter do banco deve conseguir provar a mesma fronteira que o código aplica.
-- A criação passa a rodar como security invoker: a sessão precisa da policy de
-- INSERT, e essa policy só aceita uma linha inicial vazia. As FKs compostas
-- continuam garantindo que empresa, contato e oportunidade pertencem ao dono.

create policy diagnosticos_atendimento_insert_inicial
  on public.diagnosticos_atendimento
  for insert to authenticated
  with check (
    dono = (select auth.uid())
    and status = 'na_fila'
    and resultado is null
    and nota_geral is null
    and erro is null
    and modelo is null
    and resposta_id is null
    and iniciado_em is null
    and concluido_em is null
  );

grant insert on public.diagnosticos_atendimento to authenticated;

alter function public.diagnostico_iniciar(
  uuid, public.diagnostico_atendimento_canal, text, text, text, boolean
) security invoker;

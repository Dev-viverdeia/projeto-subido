-- =============================================================================
-- ACEITE FINAL DO PROJETO
--
-- Concluir todas as tarefas deixa a entrega pronta para validação. O projeto só
-- passa a "concluído" depois que o cliente aprova a última entrega no portal.
-- O nome deste arquivo acompanha a versão registrada pelo ambiente remoto.
-- =============================================================================

begin;

create or replace function private.projeto_sincronizar_progresso()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_total integer;
  v_concluidas integer;
  v_aceite_final public.projeto_cliente_status;
begin
  select
    count(*)::integer,
    count(*) filter (where status = 'concluida')::integer
  into v_total, v_concluidas
  from public.projeto_tarefas
  where projeto_execucao_id = new.projeto_execucao_id
    and dono = new.dono;

  select cliente_status
  into v_aceite_final
  from public.projeto_tarefas
  where projeto_execucao_id = new.projeto_execucao_id
    and dono = new.dono
  order by ordem desc, id desc
  limit 1;

  update public.projetos_execucao
  set
    status = case
      when v_total > 0
        and v_concluidas = v_total
        and v_aceite_final = 'aprovada'
        then 'concluido'::public.projeto_execucao_status
      when v_total > 0 and v_concluidas = v_total
        then 'em_validacao'::public.projeto_execucao_status
      when status in ('planejamento', 'em_validacao', 'concluido')
        then 'em_execucao'::public.projeto_execucao_status
      else status
    end,
    concluido_em = case
      when v_total > 0
        and v_concluidas = v_total
        and v_aceite_final = 'aprovada'
        then coalesce(concluido_em, now())
      else null
    end
  where id = new.projeto_execucao_id
    and dono = new.dono;

  return new;
end;
$$;

revoke execute on function private.projeto_sincronizar_progresso() from public, anon, authenticated;

create or replace function public.projeto_portal_decidir(
  p_codigo uuid,
  p_tarefa_id uuid,
  p_decisao public.projeto_cliente_status,
  p_comentario text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_atualizada uuid;
  v_projeto_id uuid;
begin
  if p_decisao not in ('aprovada', 'ajustes') then
    raise exception 'decisao_invalida';
  end if;

  update public.projeto_tarefas tarefa
  set
    cliente_status = p_decisao,
    cliente_comentario = nullif(btrim(coalesce(p_comentario, '')), '')
  from public.projetos_execucao projeto
  where tarefa.id = p_tarefa_id
    and tarefa.projeto_execucao_id = projeto.id
    and projeto.portal_codigo = p_codigo
    and projeto.portal_ativo
    and tarefa.cliente_status = 'aguardando'
  returning tarefa.id, tarefa.projeto_execucao_id
  into v_atualizada, v_projeto_id;

  if v_atualizada is null then
    return false;
  end if;

  if p_decisao = 'aprovada' then
    update public.projetos_execucao projeto
    set
      status = 'concluido',
      concluido_em = coalesce(projeto.concluido_em, now())
    where projeto.id = v_projeto_id
      and not exists (
        select 1
        from public.projeto_tarefas pendente
        where pendente.projeto_execucao_id = projeto.id
          and pendente.status <> 'concluida'
      )
      and p_tarefa_id = (
        select ultima.id
        from public.projeto_tarefas ultima
        where ultima.projeto_execucao_id = projeto.id
        order by ultima.ordem desc, ultima.id desc
        limit 1
      );
  end if;

  return true;
end;
$$;

revoke execute on function public.projeto_portal_decidir(uuid, uuid, public.projeto_cliente_status, text)
  from public, anon, authenticated;
grant execute on function public.projeto_portal_decidir(uuid, uuid, public.projeto_cliente_status, text)
  to service_role;

-- Corrige projetos que foram marcados como concluídos automaticamente antes de
-- existir o aceite final. Projetos que já têm a última entrega aprovada ficam intactos.
update public.projetos_execucao projeto
set status = 'em_validacao', concluido_em = null
where projeto.status = 'concluido'
  and exists (
    select 1
    from public.projeto_tarefas tarefa
    where tarefa.projeto_execucao_id = projeto.id
  )
  and not exists (
    select 1
    from public.projeto_tarefas tarefa
    where tarefa.projeto_execucao_id = projeto.id
      and tarefa.status <> 'concluida'
  )
  and coalesce((
    select ultima.cliente_status
    from public.projeto_tarefas ultima
    where ultima.projeto_execucao_id = projeto.id
    order by ultima.ordem desc, ultima.id desc
    limit 1
  ), 'nao_solicitada'::public.projeto_cliente_status) <> 'aprovada';

commit;

begin;

-- crm_eventos é append-only: o usuário não recebe permissão de INSERT.
-- O trigger grava somente alterações verificadas na própria linha autorizada.
create function private.projeto_gestao_auditar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_titulo text;
begin
  if new.tipo_servico is distinct from old.tipo_servico then
    v_titulo := case new.tipo_servico when 'pontual' then 'Projeto definido como pontual' else 'Projeto definido como recorrente' end;
  elsif new.encerramento_manual_em is distinct from old.encerramento_manual_em and new.encerramento_manual_em is not null then
    v_titulo := 'Entrega concluída pelo profissional';
  elsif old.status = 'concluido' and new.status <> 'concluido' then
    v_titulo := 'Execução do projeto reaberta';
  elsif new.recorrencia_encerrada_em is distinct from old.recorrencia_encerrada_em then
    v_titulo := case when new.recorrencia_encerrada_em is null then 'Acompanhamento recorrente retomado' else 'Acompanhamento recorrente encerrado' end;
  else return new;
  end if;
  insert into public.crm_eventos (dono, empresa_id, oportunidade_id, tipo, titulo, descricao, dados, fonte, fonte_id)
  values (new.dono, new.empresa_id, new.oportunidade_id, 'projeto_gestao_alterada', v_titulo, new.titulo,
    jsonb_build_object('projeto_execucao_id', new.id, 'tipo_servico', new.tipo_servico,
      'encerramento_manual_em', new.encerramento_manual_em, 'recorrencia_encerrada_em', new.recorrencia_encerrada_em),
    'projetos', new.id::text);
  return new;
end;
$$;
revoke execute on function private.projeto_gestao_auditar() from public, anon, authenticated;
create trigger projetos_gestao_auditar after update of tipo_servico, status, encerramento_manual_em, recorrencia_encerrada_em
  on public.projetos_execucao for each row execute function private.projeto_gestao_auditar();

create or replace function public.projeto_gerenciar_entrega(
  p_projeto_id uuid, p_acao text, p_atualizado_em timestamptz,
  p_confirmar_pendencias boolean default false
)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_dono uuid := (select auth.uid());
  v_projeto public.projetos_execucao%rowtype;
  v_titulo text;
begin
  if v_dono is null then raise exception 'autenticacao_necessaria' using errcode = '28000'; end if;
  if p_acao is null or p_acao not in ('pontual', 'recorrente', 'concluir', 'reabrir', 'encerrar_recorrencia', 'retomar_recorrencia')
    or p_atualizado_em is null then
    raise exception 'acao_invalida' using errcode = '22023';
  end if;
  select * into v_projeto from public.projetos_execucao
  where id = p_projeto_id and dono = v_dono for update;
  if not found then raise exception 'projeto_indisponivel' using errcode = 'P0002'; end if;

  -- Repetir a mesma intenção não muda datas nem duplica o histórico.
  if (p_acao in ('pontual', 'recorrente') and v_projeto.tipo_servico = p_acao)
    or (p_acao = 'concluir' and v_projeto.status = 'concluido')
    or (p_acao = 'reabrir' and v_projeto.status <> 'concluido')
    or (p_acao = 'encerrar_recorrencia' and v_projeto.recorrencia_encerrada_em is not null)
    or (p_acao = 'retomar_recorrencia' and v_projeto.tipo_servico = 'recorrente' and v_projeto.recorrencia_encerrada_em is null)
    then return true; end if;
  if v_projeto.atualizado_em is distinct from p_atualizado_em then
    raise exception 'projeto_alterado' using errcode = '40001';
  end if;

  if p_acao in ('pontual', 'recorrente') then
    update public.projetos_execucao set tipo_servico = p_acao where id = p_projeto_id and dono = v_dono;
    v_titulo := case p_acao when 'pontual' then 'Projeto definido como pontual' else 'Projeto definido como recorrente' end;
  elsif p_acao = 'concluir' then
    if not coalesce(p_confirmar_pendencias, false) and (
      exists (select 1 from public.projeto_tarefas where projeto_execucao_id = p_projeto_id and dono = v_dono
        and (status <> 'concluida' or cliente_status in ('aguardando', 'ajustes')))
      or exists (select 1 from public.projeto_acoes where projeto_execucao_id = p_projeto_id and dono = v_dono and status = 'pendente')
    ) then raise exception 'pendencias_na_entrega' using errcode = '22023'; end if;
    update public.projetos_execucao set status = 'concluido', concluido_em = now(), encerramento_manual_em = now()
      where id = p_projeto_id and dono = v_dono;
    v_titulo := 'Entrega concluída pelo profissional';
  elsif p_acao = 'reabrir' then
    update public.projetos_execucao set status = 'em_execucao', concluido_em = null
      where id = p_projeto_id and dono = v_dono;
    v_titulo := 'Execução do projeto reaberta';
  else
    if v_projeto.tipo_servico <> 'recorrente' or v_projeto.status <> 'concluido' then
      raise exception 'recorrencia_indisponivel' using errcode = '22023';
    end if;
    if p_acao = 'encerrar_recorrencia' and not coalesce(p_confirmar_pendencias, false) and (
      exists (select 1 from public.projeto_tarefas where projeto_execucao_id = p_projeto_id and dono = v_dono
        and (status <> 'concluida' or cliente_status in ('aguardando', 'ajustes')))
      or exists (select 1 from public.projeto_acoes where projeto_execucao_id = p_projeto_id and dono = v_dono and status = 'pendente')
    ) then raise exception 'pendencias_na_entrega' using errcode = '22023'; end if;
    update public.projetos_execucao
      set recorrencia_encerrada_em = case when p_acao = 'encerrar_recorrencia' then now() else null end
      where id = p_projeto_id and dono = v_dono;
    v_titulo := case p_acao when 'encerrar_recorrencia' then 'Acompanhamento recorrente encerrado' else 'Acompanhamento recorrente retomado' end;
  end if;

  return true;
end;
$$;

commit;

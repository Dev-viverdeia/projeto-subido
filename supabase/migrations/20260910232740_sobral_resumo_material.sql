-- Um resumo revisado por resposta. A nota é imutável e não altera o pipeline.
create unique index crm_eventos_sobral_material_unico
  on public.crm_eventos(dono,fonte_id) where fonte='sobral_material';

create function public.sobral_salvar_material(
  p_mensagem uuid, p_oportunidade uuid, p_resumo jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_dono uuid := auth.uid();
  v_material jsonb;
  v_thread uuid;
  v_pergunta uuid;
  v_fonte jsonb;
  v_campo text;
  v_rotulo text;
  v_resumo jsonb := '{}'::jsonb;
  v_descricao text := '';
  v_oportunidade public.crm_oportunidades;
  v_evento public.crm_eventos;
begin
  if v_dono is null or public.plano_subido_atual() not in ('pro','enterprise') then
    raise exception using errcode='42501',message='Recurso indisponível';
  end if;
  if p_mensagem is null or p_oportunidade is null or p_resumo is null
    or jsonb_typeof(p_resumo)<>'object' then
    raise exception using errcode='22023',message='Resumo inválido';
  end if;
  foreach v_campo in array array['titulo','escopo','decisoes','tarefas','pendencias'] loop
    if jsonb_typeof(p_resumo->v_campo) is distinct from 'string'
      or char_length(btrim(p_resumo->>v_campo)) > (case v_campo when 'titulo' then 120 when 'pendencias' then 800 else 1200 end) then
      raise exception using errcode='22023',message='Resumo inválido';
    end if;
    v_resumo := v_resumo || jsonb_build_object(v_campo,btrim(p_resumo->>v_campo));
  end loop;
  if char_length(v_resumo->>'titulo')<3 or concat(v_resumo->>'escopo',v_resumo->>'decisoes',v_resumo->>'tarefas',v_resumo->>'pendencias')='' then
    raise exception using errcode='22023',message='Resumo vazio';
  end if;
  -- Somente respostas produzidas pelo servidor; o usuário não pode inserir
  -- mensagens de consultor. O lock serializa confirmações da mesma resposta.
  select m.direcao->'material',m.thread_id into v_material,v_thread
    from public.consultor_mensagens m join public.consultor_threads t on t.id=m.thread_id
    where m.id=p_mensagem and m.papel='consultor' and t.dono=v_dono for update of m;
  if not found or v_material is null or jsonb_typeof(v_material->'fontes') is distinct from 'array' then
    raise exception using errcode='42501',message='Resumo indisponível';
  end if;
  select mensagem_id into v_pergunta from public.sobral_geracoes
    where resposta_id=p_mensagem and dono=v_dono and thread_id=v_thread and estado='concluida';
  if not found or jsonb_array_length(v_material->'fontes') not between 1 and 4 then
    raise exception using errcode='42501',message='Origem indisponível';
  end if;
  for v_fonte in select value from jsonb_array_elements(v_material->'fontes') loop
    if not exists (select 1 from public.consultor_anexos a where a.id::text=v_fonte->>'id'
      and a.mensagem_id=v_pergunta and a.dono=v_dono and a.nome=v_fonte->>'nome') then
      raise exception using errcode='42501',message='Origem indisponível';
    end if;
  end loop;
  select * into v_evento from public.crm_eventos
    where dono=v_dono and fonte='sobral_material' and fonte_id=p_mensagem::text;
  if found then
    if v_evento.oportunidade_id<>p_oportunidade or v_evento.dados->'resumo' is distinct from v_resumo then
      raise exception using errcode='PT409',message='Resumo já registrado';
    end if;
    return jsonb_build_object('id',v_evento.id,'oportunidade',v_evento.oportunidade_id,'salvoEm',v_evento.criado_em);
  end if;
  -- Notas também podem documentar fichas encerradas, sem reabri-las.
  select * into v_oportunidade from public.crm_oportunidades where id=p_oportunidade and dono=v_dono for key share;
  if not found then raise exception using errcode='42501',message='Ficha indisponível'; end if;
  foreach v_campo in array array['escopo','decisoes','tarefas','pendencias'] loop
    v_rotulo := case v_campo when 'escopo' then 'Escopo' when 'decisoes' then 'Decisões'
      when 'tarefas' then 'Tarefas sugeridas' else 'A confirmar' end;
    if v_resumo->>v_campo<>'' then
      v_descricao := v_descricao || case when v_descricao='' then '' else E'\n\n' end || v_rotulo || E'\n' || (v_resumo->>v_campo);
    end if;
  end loop;
  insert into public.crm_eventos(dono,empresa_id,oportunidade_id,tipo,titulo,descricao,dados,fonte,fonte_id)
    values(v_dono,v_oportunidade.empresa_id,p_oportunidade,'nota',v_resumo->>'titulo',v_descricao,
      jsonb_build_object('resumo',v_resumo,'fontes',v_material->'fontes','conversa',v_thread,'mensagem',p_mensagem,'revisado',true),
      'sobral_material',p_mensagem::text) returning * into v_evento;
  return jsonb_build_object('id',v_evento.id,'oportunidade',v_evento.oportunidade_id,'salvoEm',v_evento.criado_em);
end; $$;
revoke all on function public.sobral_salvar_material(uuid,uuid,jsonb) from public,anon;
grant execute on function public.sobral_salvar_material(uuid,uuid,jsonb) to authenticated;
comment on function public.sobral_salvar_material(uuid,uuid,jsonb) is
  'Salva uma nota revisada na ficha do próprio usuário, sem executar tarefas ou alterar a venda. Idempotente por resposta.';

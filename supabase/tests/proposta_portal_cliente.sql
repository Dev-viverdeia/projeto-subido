-- Teste transacional contra o schema real. Nada persiste: o rollback final
-- desfaz status, visualizacao, eventos e eventual projeto criado.
begin;

do $$
declare
  v_proposta_id uuid;
  v_codigo uuid;
  v_versao integer;
  v_versao_apos_view integer;
  v_visualizacoes integer;
  v_resultado jsonb;
begin
  select id
  into v_proposta_id
  from public.propostas
  order by criado_em
  limit 1;

  if v_proposta_id is null then
    raise exception 'teste_precisa_de_uma_proposta_existente';
  end if;

  update public.propostas
  set status = 'apresentada'
  where id = v_proposta_id;

  select compartilhamento_codigo, versao
  into v_codigo, v_versao
  from public.propostas
  where id = v_proposta_id;

  if v_codigo is null then
    raise exception 'link_publico_nao_foi_criado';
  end if;

  if not public.proposta_portal_visualizar(v_codigo) then
    raise exception 'visualizacao_nao_foi_registrada';
  end if;

  select versao, visualizacoes
  into v_versao_apos_view, v_visualizacoes
  from public.propostas
  where id = v_proposta_id;

  if v_versao_apos_view <> v_versao then
    raise exception 'visualizacao_alterou_a_versao';
  end if;
  if v_visualizacoes <> 1 then
    raise exception 'contador_de_visualizacao_incorreto';
  end if;

  v_resultado := public.proposta_portal_decidir(
    v_codigo,
    'aceita',
    'Cliente de teste',
    'cliente.teste@example.com',
    'Aprovada no teste transacional.'
  );

  if v_resultado #>> '{status}' <> 'aceita' then
    raise exception 'decisao_nao_foi_registrada';
  end if;
  if nullif(v_resultado #>> '{projeto_id}', '') is null then
    raise exception 'projeto_nao_foi_criado';
  end if;
  if not exists (
    select 1
    from public.propostas
    where id = v_proposta_id
      and status = 'aceita'
      and decisao_nome = 'Cliente de teste'
      and decisao_email = 'cliente.teste@example.com'
  ) then
    raise exception 'identidade_da_decisao_nao_foi_guardada';
  end if;
  if not exists (
    select 1
    from public.projetos_execucao
    where proposta_id = v_proposta_id
  ) then
    raise exception 'entrega_nao_foi_aberta';
  end if;
  if not exists (
    select 1
    from public.crm_oportunidades oportunidade
    join public.propostas proposta on proposta.oportunidade_id = oportunidade.id
    where proposta.id = v_proposta_id
      and oportunidade.etapa = 'ganho'
  ) then
    raise exception 'crm_nao_foi_atualizado';
  end if;
end;
$$;

rollback;

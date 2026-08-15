-- A funcao original usava o nome legado `solucao_id`. O schema consolidado usa
-- `projeto_id`; o erro so aparecia quando uma proposta de catalogo era aceita.
begin;

create or replace function private.projeto_criar_da_proposta(
  p_proposta_id uuid,
  p_dono uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_proposta public.propostas%rowtype;
  v_execucao_id uuid;
begin
  select * into v_proposta
  from public.propostas
  where id = p_proposta_id and dono = p_dono;

  if not found then
    raise exception 'proposta_nao_encontrada' using errcode = 'P0002';
  end if;

  if v_proposta.status <> 'aceita' then
    raise exception 'proposta_precisa_estar_aceita' using errcode = '22023';
  end if;

  insert into public.projetos_execucao (
    dono, proposta_id, empresa_id, oportunidade_id,
    projeto_id, builder_solucao_id, titulo, documento
  ) values (
    p_dono,
    v_proposta.id,
    v_proposta.empresa_id,
    v_proposta.oportunidade_id,
    v_proposta.projeto_id,
    v_proposta.builder_solucao_id,
    coalesce(nullif(v_proposta.documento #>> '{projeto,titulo}', ''), v_proposta.titulo),
    v_proposta.documento
  )
  on conflict (proposta_id) do nothing
  returning id into v_execucao_id;

  if v_execucao_id is null then
    select id into v_execucao_id
    from public.projetos_execucao
    where proposta_id = v_proposta.id and dono = p_dono;
    return v_execucao_id;
  end if;

  if v_proposta.projeto_id is not null then
    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      p_dono,
      v_execucao_id,
      fase.item ->> 'id',
      fase.item ->> 'titulo',
      (fase.item ->> 'id') || ':' || (passo.item ->> 'id'),
      passo.item ->> 'titulo',
      passo.item ->> 'acao',
      passo.item ->> 'concluidoQuando',
      passo.item ->> 'entregavel',
      ((fase.posicao - 1) * 1000 + passo.posicao)::integer
    from public.projeto_roteiros roteiro
    cross join lateral jsonb_array_elements(roteiro.roteiro -> 'fases')
      with ordinality as fase(item, posicao)
    cross join lateral jsonb_array_elements(fase.item -> 'passos')
      with ordinality as passo(item, posicao)
    where roteiro.projeto_id = v_proposta.projeto_id;
  end if;

  if not exists (
    select 1 from public.projeto_tarefas where projeto_execucao_id = v_execucao_id
  ) then
    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    ) values (
      p_dono, v_execucao_id, 'preparar', 'Preparar', 'confirmar-contexto',
      'Confirmar escopo, responsáveis e acessos',
      'Revise com o cliente o objetivo aprovado, nomeie os responsáveis e registre os acessos necessários antes de construir.',
      'Escopo, responsáveis, acessos e data de início estão confirmados.',
      'Checklist de kick-off aprovado.',
      1
    );

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      p_dono,
      v_execucao_id,
      'construir',
      'Construir',
      'escopo-' || item.posicao::text,
      item.valor ->> 'titulo',
      item.valor ->> 'descricao',
      'O item foi construído, testado pelo profissional e está pronto para validação do cliente.',
      item.valor ->> 'titulo',
      (1000 + item.posicao)::integer
    from jsonb_array_elements(v_proposta.documento -> 'escopo')
      with ordinality as item(valor, posicao);

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    ) values (
      p_dono, v_execucao_id, 'validar', 'Validar', 'validar-cliente',
      'Validar a operação com o cliente',
      'Conduza os testes com situações reais, registre ajustes e peça um aceite explícito antes da publicação final.',
      'O cliente concluiu os cenários combinados e aprovou os ajustes registrados.',
      'Aceite de validação do cliente.',
      2001
    );

    insert into public.projeto_tarefas (
      dono, projeto_execucao_id, fase_id, fase_titulo, passo_id,
      titulo, acao, concluido_quando, entregavel, ordem
    )
    select
      p_dono,
      v_execucao_id,
      'entregar',
      'Entregar',
      'entregavel-' || item.posicao::text,
      'Entregar ' || (item.valor #>> '{}'),
      'Organize a versão final, registre onde ela está e apresente ao responsável pela operação.',
      'O cliente recebeu, sabe acessar e existe um responsável pela continuidade.',
      item.valor #>> '{}',
      (3000 + item.posicao)::integer
    from jsonb_array_elements(v_proposta.documento -> 'entregaveis')
      with ordinality as item(valor, posicao);
  end if;

  return v_execucao_id;
end;
$$;

revoke all on function private.projeto_criar_da_proposta(uuid, uuid)
  from public, anon, authenticated;
grant execute on function private.projeto_criar_da_proposta(uuid, uuid)
  to service_role;

commit;

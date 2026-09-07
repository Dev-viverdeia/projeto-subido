-- Uma solicitação reserva o saldo e entra na fila na mesma transação.
-- Reenvios recuperam a mesma lista, inclusive após a conclusão.
begin;

create unique index prospeccao_listas_pedido_unico
  on public.prospeccao_listas (dono, (filtros ->> 'pedido'))
  where filtros ->> 'pedido' is not null;

create function public.prospeccao_sistema_solicitar_lista(
  p_dono uuid, p_pedido uuid, p_segmento text, p_localizacao text, p_quantidade integer
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lista public.prospeccao_listas%rowtype;
  v_id uuid;
  v_segmento text := btrim(coalesce(p_segmento, ''));
  v_localizacao text := btrim(coalesce(p_localizacao, ''));
begin
  if p_dono is null or p_pedido is null or p_quantidade is null
     or p_quantidade not in (5, 10, 20)
     or char_length(v_segmento) not between 2 and 160
     or char_length(v_localizacao) not between 2 and 180 then
    raise exception 'solicitacao_invalida' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('pedido_prospeccao:' || p_dono::text || ':' || p_pedido::text, 0));
  select * into v_lista from public.prospeccao_listas
    where dono = p_dono and filtros ->> 'pedido' = p_pedido::text;
  if found then
    if v_lista.segmento is distinct from v_segmento
       or v_lista.localizacao is distinct from v_localizacao
       or v_lista.quantidade_solicitada is distinct from p_quantidade then
      raise exception 'solicitacao_divergente' using errcode = '22023';
    end if;
    return v_lista.id;
  end if;

  v_id := public.prospeccao_sistema_criar_lista(
    p_dono, left(v_segmento || ' · ' || v_localizacao, 160), v_segmento, v_localizacao,
    '{}'::text[], p_quantidade,
    jsonb_build_object('arquitetura', 'prospeccao-qualificada-v1', 'pedido', p_pedido)
  );

  insert into public.operacoes_jobs (
    dono, tipo, chave_idempotencia, referencia_tipo, referencia_id, payload,
    prioridade, max_tentativas
  ) values (
    p_dono, 'prospeccao', 'prospeccao:' || v_id::text, 'prospeccao_lista', v_id,
    jsonb_build_object('dono', p_dono, 'lista', v_id, 'busca', jsonb_build_object(
      'segmento', v_segmento, 'localizacao', v_localizacao, 'quantidade', p_quantidade
    )), 10, 3
  );
  return v_id;
end;
$$;

revoke all on function public.prospeccao_sistema_solicitar_lista(uuid, uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.prospeccao_sistema_solicitar_lista(uuid, uuid, text, text, integer)
  to service_role;

commit;

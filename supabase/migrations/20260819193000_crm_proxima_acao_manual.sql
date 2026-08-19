-- =============================================================================
-- CRM · PRÓXIMA AÇÃO MANUAL
--
-- O profissional pode registrar o próximo movimento da venda sem depender de
-- uma call ou de uma recomendação da IA. A trigger já existente publica toda
-- alteração na linha do tempo da oportunidade.
-- =============================================================================

create or replace function public.crm_definir_proxima_acao(
  p_oportunidade uuid,
  p_acao text,
  p_quando timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_acao text := nullif(btrim(coalesce(p_acao, '')), '');
begin
  if v_dono is null then
    raise exception 'sessao_necessaria' using errcode = '42501';
  end if;

  if v_acao is null or char_length(v_acao) > 500 then
    raise exception 'acao_invalida' using errcode = '22023';
  end if;

  update public.crm_oportunidades
  set
    proxima_acao = v_acao,
    proxima_acao_em = p_quando
  where id = p_oportunidade
    and dono = v_dono
    and etapa not in ('ganho', 'perdido');

  if not found then
    raise exception 'oportunidade_nao_encontrada' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

comment on function public.crm_definir_proxima_acao(uuid, text, timestamptz) is
  'Registra o próximo movimento de uma oportunidade aberta do próprio usuário.';

revoke execute on function public.crm_definir_proxima_acao(uuid, text, timestamptz) from public;
revoke execute on function public.crm_definir_proxima_acao(uuid, text, timestamptz) from anon;
grant execute on function public.crm_definir_proxima_acao(uuid, text, timestamptz) to authenticated;

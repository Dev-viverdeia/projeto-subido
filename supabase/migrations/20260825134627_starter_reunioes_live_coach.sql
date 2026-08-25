-- O Starter inclui Reuniões e Live Coach, mas não expõe o módulo de Vendas.
-- Esta RPC mantém a regra central do produto (toda reunião vira memória ligada
-- a uma empresa) sem obrigar a pessoa a entrar em um CRM que seu plano não tem.
-- Se ela evoluir para o Pro, o vínculo criado aqui já aparece no pipeline.

create function public.calls_agendar_reuniao_starter(
  p_empresa_nome text,
  p_contato_nome text,
  p_contato_email text,
  p_tipo public.calls_tipo,
  p_agendada_para timestamptz,
  p_duracao_minutos smallint default 45,
  p_titulo text default null,
  p_live_coach_ativo boolean default true
)
returns table (reuniao_id uuid, codigo_publico uuid, oportunidade_id uuid)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plano text := coalesce(
    (select auth.jwt() -> 'app_metadata' ->> 'plano_subido'),
    'pro'
  );
  v_oportunidade uuid;
begin
  if v_plano <> 'starter' then
    raise exception 'fluxo_exclusivo_starter' using errcode = '42501';
  end if;

  v_oportunidade := public.crm_criar_lead(
    p_empresa_nome,
    p_contato_nome,
    p_contato_email,
    coalesce(nullif(btrim(coalesce(p_titulo, '')), ''), 'Projeto de IA para ' || btrim(p_empresa_nome))
  );

  return query
  select
    reuniao.reuniao_id,
    reuniao.codigo_publico,
    v_oportunidade
  from public.calls_agendar_reuniao(
    v_oportunidade,
    p_tipo,
    p_agendada_para,
    p_duracao_minutos,
    p_titulo,
    p_live_coach_ativo
  ) as reuniao;
end;
$$;

comment on function public.calls_agendar_reuniao_starter(
  text, text, text, public.calls_tipo, timestamptz, smallint, text, boolean
) is
  'Agenda uma reunião no Starter e cria o vínculo interno com empresa, contato e oportunidade.';

revoke execute on function public.calls_agendar_reuniao_starter(
  text, text, text, public.calls_tipo, timestamptz, smallint, text, boolean
) from public, anon;

grant execute on function public.calls_agendar_reuniao_starter(
  text, text, text, public.calls_tipo, timestamptz, smallint, text, boolean
) to authenticated;

-- A prospeccao passa a acompanhar o momento comercial anterior ao CRM.
-- O objetivo e simples: descobrir, tentar contato, confirmar conversa e so
-- entao promover a empresa para uma oportunidade.

alter table public.prospeccao_leads
  add column status_prospeccao text not null default 'novo',
  add column ultimo_canal text,
  add column ultimo_contato_em timestamptz,
  add column tentativas_contato integer not null default 0;

update public.prospeccao_leads
set status_prospeccao = 'no_crm'
where crm_oportunidade_id is not null;

alter table public.prospeccao_leads
  add constraint prospeccao_leads_status_contato_check
    check (status_prospeccao in (
      'novo', 'tentando_contato', 'conversa_iniciada', 'sem_interesse', 'no_crm'
    )),
  add constraint prospeccao_leads_ultimo_canal_check
    check (
      ultimo_canal is null or ultimo_canal in (
        'telefone', 'whatsapp', 'email', 'instagram', 'facebook', 'linkedin',
        'x', 'tiktok', 'youtube', 'pinterest'
      )
    ),
  add constraint prospeccao_leads_tentativas_check
    check (tentativas_contato >= 0);

create or replace function public.prospeccao_sistema_registrar_contato(
  p_dono uuid,
  p_lead uuid,
  p_canal text,
  p_status text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
  v_canal text;
  v_tentativas integer;
  v_contato_em timestamptz;
begin
  if p_dono is null or p_lead is null then
    raise exception 'lead_necessario' using errcode = '22023';
  end if;

  if p_status not in ('novo', 'tentando_contato', 'conversa_iniciada', 'sem_interesse') then
    raise exception 'status_invalido' using errcode = '22023';
  end if;

  if p_canal is not null and p_canal not in (
    'telefone', 'whatsapp', 'email', 'instagram', 'facebook', 'linkedin',
    'x', 'tiktok', 'youtube', 'pinterest'
  ) then
    raise exception 'canal_invalido' using errcode = '22023';
  end if;

  update public.prospeccao_leads
  set
    status_prospeccao = p_status,
    ultimo_canal = coalesce(p_canal, ultimo_canal),
    ultimo_contato_em = case
      when p_status in ('tentando_contato', 'conversa_iniciada') then now()
      else ultimo_contato_em
    end,
    tentativas_contato = tentativas_contato + case
      when p_status = 'tentando_contato' then 1
      else 0
    end
  where id = p_lead
    and dono = p_dono
    and crm_oportunidade_id is null
  returning status_prospeccao, ultimo_canal, tentativas_contato, ultimo_contato_em
  into v_status, v_canal, v_tentativas, v_contato_em;

  if not found then
    raise exception 'lead_nao_encontrado_ou_ja_convertido' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'status', v_status,
    'canal', v_canal,
    'tentativas', v_tentativas,
    'contato_em', v_contato_em
  );
end;
$$;

revoke execute on function public.prospeccao_sistema_registrar_contato(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.prospeccao_sistema_registrar_contato(uuid, uuid, text, text)
  to service_role;

create index prospeccao_leads_status_idx
  on public.prospeccao_leads (dono, lista_id, status_prospeccao);

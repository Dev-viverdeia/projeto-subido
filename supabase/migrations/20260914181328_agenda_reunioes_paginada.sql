-- Leitura da agenda sem a janela truncada dos 200 registros mais antigos.
-- A sessão e as RLS existentes continuam determinando quem pode ler cada linha.
create or replace function public.calls_listar_agenda(
  p_visao text default 'proximas',
  p_busca text default '',
  p_cursor_data timestamptz default null,
  p_cursor_id uuid default null,
  p_agora timestamptz default now()
)
returns table (
  id uuid, titulo text, tipo public.calls_tipo, status public.calls_status,
  agendada_para timestamptz, duracao_minutos smallint, codigo_publico uuid,
  live_coach_ativo boolean, oportunidade_id uuid, convidado_email text,
  google_sync_status text, google_event_url text, google_sync_erro text,
  criada_em timestamptz, atualizada_em timestamptz,
  empresa text, contato text, oportunidade text
)
language sql stable security invoker set search_path = ''
as $$
  select r.id, r.titulo, r.tipo, r.status, r.agendada_para, r.duracao_minutos,
    r.codigo_publico, r.live_coach_ativo, r.oportunidade_id, r.convidado_email,
    r.google_sync_status, r.google_event_url, r.google_sync_erro,
    r.criada_em, r.atualizada_em, e.nome, c.nome, o.titulo
  from public.calls_reunioes r
  left join public.crm_empresas e on e.dono = r.dono and e.id = r.empresa_id
  left join public.crm_contatos c on c.dono = r.dono and c.id = r.contato_id
  left join public.crm_oportunidades o on o.dono = r.dono and o.id = r.oportunidade_id
  where r.dono = (select auth.uid())
    and case p_visao
      when 'proximas' then r.status in ('agendada', 'aguardando', 'ao_vivo')
        and r.agendada_para + (r.duracao_minutos + 60) * interval '1 minute' >= p_agora
      when 'pendentes' then r.status in ('agendada', 'aguardando', 'ao_vivo')
        and r.agendada_para + (r.duracao_minutos + 60) * interval '1 minute' < p_agora
      when 'historico' then r.status in ('concluida', 'cancelada', 'processando')
      else false
    end
    -- Busca literal: %, _, vírgulas e aspas não alteram filtros ou padrões SQL.
    and (coalesce(btrim(p_busca), '') = '' or exists (
      select 1 from unnest(array[r.titulo, e.nome, c.nome, o.titulo, r.convidado_email]) valor
      where strpos(lower(valor), lower(left(btrim(p_busca), 100))) > 0
    ))
    and (p_cursor_data is null or p_cursor_id is null or case
      when p_visao = 'proximas' then (r.agendada_para, r.id) > (p_cursor_data, p_cursor_id)
      else (r.agendada_para, r.id) < (p_cursor_data, p_cursor_id)
    end)
  order by
    case when p_visao = 'proximas' then r.agendada_para end asc,
    case when p_visao = 'proximas' then r.id end asc,
    case when p_visao <> 'proximas' then r.agendada_para end desc,
    case when p_visao <> 'proximas' then r.id end desc
  limit 13;
$$;

revoke all on function public.calls_listar_agenda(text, text, timestamptz, uuid, timestamptz) from public, anon;
grant execute on function public.calls_listar_agenda(text, text, timestamptz, uuid, timestamptz) to authenticated;

create index if not exists calls_reunioes_agenda_paginada_idx
  on public.calls_reunioes (dono, agendada_para, id);

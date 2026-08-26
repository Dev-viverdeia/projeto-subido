-- Preserva a inteligência da Prospecção quando uma empresa vira venda.
-- A oportunidade nasce com o projeto sugerido, a pergunta de abertura e o
-- histórico de abordagem, sem pesquisar ou digitar os mesmos dados de novo.

create or replace function public.prospeccao_sistema_enviar_lead_crm(p_dono uuid, p_lead uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead public.prospeccao_leads%rowtype;
  v_existente uuid;
  v_empresa uuid;
  v_contato uuid;
  v_contato_gerado uuid;
  v_oportunidade uuid;
  v_decisor jsonb;
  v_email text;
  v_telefone text;
  v_projeto_slug text;
  v_projeto_titulo text;
  v_motivo text;
  v_pergunta text;
  v_melhor_canal text;
  v_titulo text;
  v_proxima_acao text;
begin
  if p_dono is null then
    raise exception 'dono_necessario' using errcode = '22023';
  end if;

  select * into v_lead
  from public.prospeccao_leads
  where id = p_lead and dono = p_dono
  for update;

  if not found then
    raise exception 'lead_nao_encontrado' using errcode = 'P0002';
  end if;
  if v_lead.crm_oportunidade_id is not null then
    return v_lead.crm_oportunidade_id;
  end if;

  select crm_oportunidade_id into v_existente
  from public.prospeccao_leads
  where dono = p_dono
    and chave_externa = v_lead.chave_externa
    and crm_oportunidade_id is not null
  order by enviado_crm_em desc nulls last
  limit 1;

  if v_existente is not null then
    update public.prospeccao_leads
    set
      crm_oportunidade_id = v_existente,
      enviado_crm_em = now(),
      status_prospeccao = 'no_crm'
    where id = p_lead and dono = p_dono;
    return v_existente;
  end if;

  v_email := left(nullif(btrim(coalesce(v_lead.emails ->> 0, '')), ''), 320);
  v_telefone := coalesce(
    left(nullif(btrim(coalesce(v_lead.telefones ->> 0, '')), ''), 80),
    v_lead.telefone
  );
  v_projeto_slug := nullif(btrim(v_lead.qualificacao #>> '{oportunidade,projeto_slug}'), '');
  v_projeto_titulo := nullif(btrim(v_lead.qualificacao #>> '{oportunidade,projeto_titulo}'), '');
  v_motivo := nullif(btrim(v_lead.qualificacao #>> '{oportunidade,motivo}'), '');
  v_pergunta := nullif(btrim(v_lead.qualificacao #>> '{oportunidade,pergunta_abertura}'), '');
  v_melhor_canal := nullif(btrim(v_lead.qualificacao #>> '{oportunidade,melhor_canal}'), '');
  v_titulo := left(
    coalesce(v_projeto_titulo || ' · ' || v_lead.nome, 'Projeto de IA para ' || v_lead.nome),
    180
  );
  v_proxima_acao := left(
    coalesce(
      'Agendar uma descoberta e validar: ' || v_pergunta,
      'Agendar uma descoberta para entender o problema, o impacto e quem decide.'
    ),
    500
  );

  insert into public.crm_empresas (
    dono, nome, dominio, setor, cidade, estado, resumo, enriquecimento
  ) values (
    p_dono,
    v_lead.nome,
    v_lead.dominio,
    v_lead.categoria,
    v_lead.cidade,
    v_lead.estado,
    v_lead.descricao,
    jsonb_build_object(
      'origem', 'prospeccao',
      'endereco', v_lead.endereco,
      'site_url', v_lead.site_url,
      'maps_url', v_lead.maps_url,
      'emails', v_lead.emails,
      'telefones', v_lead.telefones,
      'redes_sociais', v_lead.redes_sociais,
      'decisores', v_lead.decisores,
      'horarios', v_lead.horarios,
      'qualificacao', v_lead.qualificacao,
      'fontes', v_lead.fontes,
      'dados_publicos', v_lead.dados
    )
  ) returning id into v_empresa;

  for v_decisor in
    select value from jsonb_array_elements(v_lead.decisores) limit 5
  loop
    insert into public.crm_contatos (
      dono, empresa_id, nome, email, telefone, cargo, linkedin_url
    ) values (
      p_dono,
      v_empresa,
      left(coalesce(nullif(btrim(v_decisor ->> 'nome'), ''), 'Contato a identificar'), 160),
      left(coalesce(
        nullif(btrim(v_decisor ->> 'email'), ''),
        case when v_contato is null then v_email else null end
      ), 320),
      left(coalesce(
        nullif(btrim(v_decisor ->> 'telefone'), ''),
        case when v_contato is null then v_telefone else null end
      ), 80),
      left(nullif(btrim(v_decisor ->> 'cargo'), ''), 180),
      left(nullif(btrim(v_decisor ->> 'linkedin_url'), ''), 2048)
    ) returning id into v_contato_gerado;

    if v_contato is null then
      v_contato := v_contato_gerado;
    end if;
  end loop;

  if v_contato is null then
    insert into public.crm_contatos (dono, empresa_id, nome, email, telefone)
    values (p_dono, v_empresa, 'Contato a identificar', v_email, v_telefone)
    returning id into v_contato;
  end if;

  insert into public.crm_oportunidades (
    dono, empresa_id, contato_principal_id, titulo, etapa, origem, proxima_acao
  ) values (
    p_dono, v_empresa, v_contato, v_titulo, 'novo_lead', 'prospeccao', v_proxima_acao
  ) returning id into v_oportunidade;

  insert into public.crm_eventos (
    dono, empresa_id, contato_id, oportunidade_id, tipo, titulo,
    descricao, dados, fonte, fonte_id
  ) values (
    p_dono, v_empresa, v_contato, v_oportunidade, 'lead_criado',
    'Empresa adicionada pela Prospecção',
    coalesce(v_motivo, 'Empresa revisada em uma lista e adicionada para trabalhar a venda.'),
    jsonb_build_object(
      'etapa', 'novo_lead',
      'origem', 'prospeccao',
      'lista_id', v_lead.lista_id,
      'lead_id', v_lead.id,
      'completude', v_lead.qualificacao -> 'completude',
      'projeto_slug', v_projeto_slug,
      'projeto_titulo', v_projeto_titulo,
      'pergunta_abertura', v_pergunta,
      'melhor_canal', v_melhor_canal,
      'tentativas_contato', v_lead.tentativas_contato,
      'ultimo_canal', v_lead.ultimo_canal
    ),
    'prospeccao', v_lead.id::text
  );

  update public.prospeccao_leads
  set
    crm_oportunidade_id = v_oportunidade,
    enviado_crm_em = now(),
    status_prospeccao = 'no_crm'
  where id = p_lead and dono = p_dono;

  return v_oportunidade;
end;
$$;

revoke execute on function public.prospeccao_sistema_enviar_lead_crm(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.prospeccao_sistema_enviar_lead_crm(uuid, uuid)
  to service_role;

comment on function public.prospeccao_sistema_enviar_lead_crm(uuid, uuid) is
  'Promove um lead para Vendas preservando contatos, projeto sugerido, abordagem e próxima ação.';

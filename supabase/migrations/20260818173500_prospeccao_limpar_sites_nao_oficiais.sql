-- Links de mensageria, redes sociais, mapas e agregadores de bio não são o
-- domínio oficial da empresa. Além de aparecerem de forma enganosa no dossiê,
-- eles podem associar profissionais da própria plataforma ao lead. Limpa os
-- falsos positivos já armazenados; a aplicação impede novas ocorrências.

with leads_afetados as (
  select id
  from public.prospeccao_leads
  where lower(coalesce(dominio, '')) ~
    '(^|\.)(whatsapp\.com|wa\.me|instagram\.com|facebook\.com|fb\.com|linkedin\.com|x\.com|twitter\.com|tiktok\.com|youtube\.com|youtu\.be|pinterest\.com|pin\.it|google\.com|google\.com\.br|g\.page|goo\.gl|linktr\.ee|beacons\.ai|bio\.site)$'
)
update public.prospeccao_leads as lead
set
  site_url = null,
  dominio = null,
  decisores = '[]'::jsonb,
  fontes = coalesce(
    (
      select jsonb_agg(fonte)
      from jsonb_array_elements(lead.fontes) as fonte
      where fonte #>> '{}' not like 'FullEnrich%'
        and fonte #>> '{}' not like 'Site oficial%'
    ),
    '[]'::jsonb
  ),
  qualificacao = jsonb_build_object(
    'completude',
      case when lead.telefone is not null or jsonb_array_length(lead.telefones) > 0 then 20 else 0 end
      + case when jsonb_array_length(lead.emails) > 0 then 25 else 0 end
      + case when jsonb_array_length(lead.redes_sociais) > 0 then 15 else 0 end,
    'itens', jsonb_build_object(
      'telefone', lead.telefone is not null or jsonb_array_length(lead.telefones) > 0,
      'email', jsonb_array_length(lead.emails) > 0,
      'site', false,
      'redes_sociais', jsonb_array_length(lead.redes_sociais) > 0,
      'decisores', false
    ),
    'sinais', to_jsonb(array_remove(array[
      case
        when (lead.telefone is not null or jsonb_array_length(lead.telefones) > 0)
          and jsonb_array_length(lead.emails) > 0
          then 'Telefone e e-mail disponíveis para abordagem'
        when lead.telefone is not null or jsonb_array_length(lead.telefones) > 0
          or jsonb_array_length(lead.emails) > 0
          then 'Ao menos um canal direto de contato disponível'
      end,
      case
        when lead.avaliacao >= 4.5 and lead.total_avaliacoes >= 50
          then 'Boa reputação pública e volume relevante de avaliações'
      end,
      case
        when jsonb_array_length(lead.emails) = 0
          then 'E-mail público não encontrado; confirmar antes da abordagem'
      end,
      'Decisor ainda não identificado em fonte profissional'
    ]::text[], null))
  ),
  dados = (
    lead.dados
      - 'site_titulo'
      - 'site_descricao'
      - 'site_resumo'
      - 'paginas_consultadas'
      - 'site_contatos'
      - 'empresa_profissional'
      - 'fullenrich_contatos'
  ) || jsonb_build_object('qualidade_revisada_em', now())
where lead.id in (select id from leads_afetados);

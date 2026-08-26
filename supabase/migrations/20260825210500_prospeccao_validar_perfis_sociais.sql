-- A coleta de paginas publicas tambem encontra links de videos, posts e rotas
-- de suporte. Eles nao sao perfis da empresa e nao devem virar canais de
-- prospeccao. Limpa os falsos positivos ja salvos; a aplicacao valida os novos.

with redes_revisadas as (
  select
    lead.id,
    coalesce(
      jsonb_agg(rede.item order by rede.posicao) filter (
        where case lower(coalesce(rede.item ->> 'rede', ''))
          when 'instagram' then
            rede.item ->> 'url' ~* '^https?://([^/]+\.)?instagram\.com/[^/?#]+'
            and rede.item ->> 'url' !~* 'instagram\.com/(p|reel|reels|stories|explore|accounts|direct|about|legal|developer)([/\\?#]|$)'
          when 'facebook' then
            (
              rede.item ->> 'url' ~* '^https?://([^/]+\.)?(facebook\.com|fb\.com)/profile\.php\?([^#]*&)?id=[0-9]+'
              or (
                rede.item ->> 'url' ~* '^https?://([^/]+\.)?(facebook\.com|fb\.com)/[^/?#]+'
                and rede.item ->> 'url' !~* '(facebook\.com|fb\.com)/(share|sharer|dialog|plugins|watch|gaming|marketplace|events|help|privacy|profile\.php)([/\\?#]|$)'
              )
            )
          when 'linkedin' then
            rede.item ->> 'url' ~* '^https?://([^/]+\.)?linkedin\.com/(in|company|school|showcase)/[^/?#]+'
          when 'x' then
            rede.item ->> 'url' ~* '^https?://([^/]+\.)?(x\.com|twitter\.com)/[^/?#]+/?([?#].*)?$'
            and rede.item ->> 'url' !~* '(x\.com|twitter\.com)/(intent|share|search|i|home|explore|notifications|messages|settings|compose|jobs|about|help|support|suporte|privacy|terms)([/\\?#]|$)'
          when 'tiktok' then
            rede.item ->> 'url' ~* '^https?://([^/]+\.)?tiktok\.com/@[^/?#]+'
          when 'youtube' then
            rede.item ->> 'url' ~* '^https?://([^/]+\.)?youtube\.com/(@[^/?#]+|(channel|c|user)/[^/?#]+)'
          when 'pinterest' then
            rede.item ->> 'url' ~* '^https?://([^/]+\.)?(pinterest\.com|pin\.it)/[^/?#]+'
            and rede.item ->> 'url' !~* '(pinterest\.com|pin\.it)/(pin|ideas|search|today)([/\\?#]|$)'
          else false
        end
      ),
      '[]'::jsonb
    ) as redes_novas
  from public.prospeccao_leads as lead
  cross join lateral jsonb_array_elements(lead.redes_sociais)
    with ordinality as rede(item, posicao)
  group by lead.id
),
alterados as (
  select revisao.id, revisao.redes_novas
  from redes_revisadas as revisao
  join public.prospeccao_leads as lead on lead.id = revisao.id
  where lead.redes_sociais is distinct from revisao.redes_novas
)
update public.prospeccao_leads as lead
set
  redes_sociais = alterados.redes_novas,
  qualificacao = (lead.qualificacao - 'completude' - 'itens' - 'sinais') || jsonb_build_object(
    'completude',
      case when lead.telefone is not null or jsonb_array_length(lead.telefones) > 0 then 20 else 0 end
      + case when jsonb_array_length(lead.emails) > 0 then 25 else 0 end
      + case when lead.site_url is not null then 15 else 0 end
      + case when jsonb_array_length(alterados.redes_novas) > 0 then 15 else 0 end
      + case when jsonb_array_length(lead.decisores) > 0 then 25 else 0 end,
    'itens', jsonb_build_object(
      'telefone', lead.telefone is not null or jsonb_array_length(lead.telefones) > 0,
      'email', jsonb_array_length(lead.emails) > 0,
      'site', lead.site_url is not null,
      'redes_sociais', jsonb_array_length(alterados.redes_novas) > 0,
      'decisores', jsonb_array_length(lead.decisores) > 0
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
        when lead.site_url is not null and jsonb_array_length(alterados.redes_novas) > 0
          then 'Site e presença social encontrados'
      end,
      case
        when jsonb_array_length(lead.decisores) > 0
          then 'Possível decisor profissional mapeado'
      end,
      case
        when lead.avaliacao >= 4.5 and lead.total_avaliacoes >= 50
          then 'Boa reputação pública e volume relevante de avaliações'
      end,
      case
        when jsonb_array_length(lead.emails) = 0
          then 'E-mail público não encontrado; confirmar antes da abordagem'
      end,
      case
        when jsonb_array_length(lead.decisores) = 0
          then 'Decisor ainda não identificado em fonte profissional'
      end
    ]::text[], null))
  ),
  dados = lead.dados || jsonb_build_object('qualidade_redes_revisada_em', now())
from alterados
where lead.id = alterados.id;

-- Somente nomes e resumos públicos. Preserva IDs, slugs, progresso, roteiros
-- e os snapshots de propostas e entregas já criadas.
begin;

update public.solucoes as projeto
set titulo = novos.titulo, resumo = novos.resumo
from (values
  ('sdr-atendimento-qualificacao', 'Atendimento no WhatsApp com IA', 'Atenda, qualifique e agende conversas com a Nina, com passagem para a equipe.'),
  ('maquina-prospeccao-b2b', 'Prospecção de clientes com IA', 'Encontre empresas e contatos para a equipe de vendas abordar.'),
  ('inteligencia-comercial-com-ia', 'Assistente de reuniões com IA', 'Organize conversas em resumos, tarefas e próximos passos de venda.'),
  ('operacao-conteudo-multicanal', 'Criação de conteúdo com IA', 'Prepare conteúdos para diferentes canais, com revisão antes de publicar.'),
  ('radar-satisfacao-com-ia', 'Pesquisa de satisfação com IA', 'Colete opiniões, identifique problemas e ajude a equipe a agir.')
) as novos(slug, titulo, resumo)
where projeto.slug = novos.slug;

commit;

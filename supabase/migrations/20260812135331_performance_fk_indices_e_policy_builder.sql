-- Índices de cobertura para chaves estrangeiras usadas em exclusões, joins e filtros.
create index if not exists formacoes_criado_por_fk_idx
  on public.formacoes (criado_por);

create index if not exists mentores_usuario_id_fk_idx
  on public.mentores (usuario_id);

create index if not exists mentorias_criado_por_fk_idx
  on public.mentorias (criado_por);

create index if not exists projeto_arquivos_tarefa_fk_cover_idx
  on public.projeto_arquivos (tarefa_id);

create index if not exists projeto_portal_eventos_execucao_fk_idx
  on public.projeto_portal_eventos (projeto_execucao_id);

create index if not exists projeto_portal_eventos_tarefa_fk_idx
  on public.projeto_portal_eventos (tarefa_id);

create index if not exists projetos_execucao_builder_fk_idx
  on public.projetos_execucao (builder_solucao_id);

create index if not exists projetos_execucao_oportunidade_fk_idx
  on public.projetos_execucao (dono, empresa_id, oportunidade_id);

create index if not exists projetos_execucao_projeto_fk_idx
  on public.projetos_execucao (projeto_id);

create index if not exists projetos_execucao_proposta_fk_idx
  on public.projetos_execucao (dono, proposta_id);

create index if not exists solucoes_criado_por_fk_idx
  on public.solucoes (criado_por);

-- A policy ALL já cobre SELECT. Manter a segunda policy obrigava o Postgres
-- a avaliar duas expressões permissivas equivalentes em cada leitura.
drop policy if exists "tarefa e de quem e o projeto" on public.builder_tarefas;

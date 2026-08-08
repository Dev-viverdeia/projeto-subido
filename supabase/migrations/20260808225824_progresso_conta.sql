-- =============================================================================
-- PROGRESSO DA CONTA
--
-- O navegador deixa de ser a fonte de verdade para aulas e projetos. As quatro
-- tabelas abaixo guardam fatos pequenos e auditáveis: conclusão de aula, último
-- acesso à formação, conclusão de etapa e último acesso ao projeto.
-- =============================================================================

create table public.progresso_formacoes (
  dono uuid not null references auth.users (id) on delete cascade,
  formacao_id uuid not null references public.formacoes (id) on delete cascade,
  ultimo_acesso_em timestamptz not null default now(),
  primary key (dono, formacao_id)
);

create table public.progresso_aulas (
  dono uuid not null references auth.users (id) on delete cascade,
  aula_id uuid not null references public.aulas (id) on delete cascade,
  concluida_em timestamptz not null default now(),
  primary key (dono, aula_id)
);

create table public.progresso_projetos (
  dono uuid not null references auth.users (id) on delete cascade,
  projeto_id uuid not null references public.solucoes (id) on delete cascade,
  ultimo_acesso_em timestamptz not null default now(),
  primary key (dono, projeto_id)
);

create table public.progresso_etapas (
  dono uuid not null references auth.users (id) on delete cascade,
  projeto_id uuid not null references public.solucoes (id) on delete cascade,
  /* UUID para o formato editorial antigo; `projeto:slug:fase:passo` para o
     projeto guiado. Texto é intencional: os dois formatos já existem no produto. */
  etapa_chave text not null,
  concluida_em timestamptz not null default now(),
  primary key (dono, etapa_chave),
  constraint progresso_etapas_chave_tamanho
    check (char_length(etapa_chave) between 2 and 240)
);

comment on table public.progresso_aulas is
  'Conclusões de aula por conta. A data é a evidência usada em progresso e certificados.';
comment on table public.progresso_etapas is
  'Checklist dos projetos por conta, incluindo etapas editoriais dos projetos guiados.';

create index progresso_formacoes_formacao_fk_idx
  on public.progresso_formacoes (formacao_id);
create index progresso_aulas_aula_fk_idx
  on public.progresso_aulas (aula_id);
create index progresso_projetos_projeto_fk_idx
  on public.progresso_projetos (projeto_id);
create index progresso_etapas_projeto_fk_idx
  on public.progresso_etapas (projeto_id);

-- A RLS isola o dono; este trigger protege a integridade editorial mesmo para
-- uma chamada direta à API, fora da interface do produto.
create function private.progresso_validar_conteudo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'progresso_formacoes' then
    if not exists (
      select 1 from public.formacoes f
      where f.id = new.formacao_id and f.status = 'publicado'
    ) then
      raise exception 'formacao_indisponivel' using errcode = '22023';
    end if;
  elsif tg_table_name = 'progresso_aulas' then
    if not exists (
      select 1
      from public.aulas a
      join public.modulos m on m.id = a.modulo_id
      join public.formacoes f on f.id = m.formacao_id
      where a.id = new.aula_id and f.status = 'publicado'
    ) then
      raise exception 'aula_indisponivel' using errcode = '22023';
    end if;
  elsif tg_table_name = 'progresso_projetos' then
    if not exists (
      select 1 from public.solucoes s
      where s.id = new.projeto_id and s.status = 'publicado'
    ) then
      raise exception 'projeto_indisponivel' using errcode = '22023';
    end if;
  elsif tg_table_name = 'progresso_etapas' then
    if not exists (
      select 1
      from public.solucoes s
      where s.id = new.projeto_id
        and s.status = 'publicado'
        and (
          exists (
            select 1
            from public.solucao_itens i
            where i.solucao_id = s.id
              and i.tipo = 'etapa'
              and i.id::text = new.etapa_chave
          )
          or (
            new.etapa_chave like ('projeto:' || s.slug::text || ':%')
            and exists (
              select 1 from public.projeto_roteiros r where r.solucao_id = s.id
            )
          )
        )
    ) then
      raise exception 'etapa_indisponivel' using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function private.progresso_validar_conteudo() from public;
revoke execute on function private.progresso_validar_conteudo() from authenticated;

create trigger progresso_formacoes_validar
  before insert or update of formacao_id on public.progresso_formacoes
  for each row execute function private.progresso_validar_conteudo();
create trigger progresso_aulas_validar
  before insert or update of aula_id on public.progresso_aulas
  for each row execute function private.progresso_validar_conteudo();
create trigger progresso_projetos_validar
  before insert or update of projeto_id on public.progresso_projetos
  for each row execute function private.progresso_validar_conteudo();
create trigger progresso_etapas_validar
  before insert or update of projeto_id, etapa_chave on public.progresso_etapas
  for each row execute function private.progresso_validar_conteudo();

alter table public.progresso_formacoes enable row level security;
alter table public.progresso_aulas enable row level security;
alter table public.progresso_projetos enable row level security;
alter table public.progresso_etapas enable row level security;

create policy "profissional gerencia progresso de formacoes"
  on public.progresso_formacoes for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));
create policy "profissional gerencia progresso de aulas"
  on public.progresso_aulas for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));
create policy "profissional gerencia progresso de projetos"
  on public.progresso_projetos for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));
create policy "profissional gerencia progresso de etapas"
  on public.progresso_etapas for all to authenticated
  using (dono = (select auth.uid()))
  with check (dono = (select auth.uid()));

revoke all on table public.progresso_formacoes from anon;
revoke all on table public.progresso_aulas from anon;
revoke all on table public.progresso_projetos from anon;
revoke all on table public.progresso_etapas from anon;

grant select, insert, update, delete on table public.progresso_formacoes to authenticated;
grant select, insert, update, delete on table public.progresso_aulas to authenticated;
grant select, insert, update, delete on table public.progresso_projetos to authenticated;
grant select, insert, update, delete on table public.progresso_etapas to authenticated;

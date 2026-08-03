-- =============================================================================
-- MENTORIAS — mentores, sessões e check-in
--
-- POR QUE ESTA MIGRATION EXISTE. As mentorias eram o único pilar sem tabela: a
-- agenda vinha de `gerarAgendaExemplo(new Date())`, um gerador em código que
-- posicionava sessões em volta do instante da visita. Horário, vagas e lotação
-- eram inventados a cada request, e o próprio `page.tsx` registrava que a tela
-- não podia ir ao ar para assinante nesse estado.
--
-- ESTA MIGRATION NÃO SEMEIA NADA, e isso é decisão, não esquecimento. Mover as
-- sessões de exemplo para dentro do banco seria PIOR que deixá-las no código:
-- ali elas ainda se anunciavam como exemplo; numa tabela, passam a parecer
-- cadastro real. A agenda nasce vazia e enche quando o admin cadastrar mentor e
-- sessão.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Mentores
-- -----------------------------------------------------------------------------
create table public.mentores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  /* Uma linha de credencial. Vazio é aceitável; inventado, não. */
  headline text not null default '',
  trilha text not null check (trilha in ('implementacao', 'trafego', 'comercial', 'produto')),
  foto_url text,
  /* O mentor PODE ser um usuário da plataforma, e pode não ser — quem dá a
     mentoria nem sempre tem conta. Daí nullable, e `set null` ao apagar: perder
     o login não pode apagar o histórico de quem deu a sessão. */
  usuario_id uuid references auth.users (id) on delete set null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint mentores_nome_tamanho check (char_length(nome) between 2 and 120),
  constraint mentores_headline_tamanho check (char_length(headline) <= 160)
);

-- -----------------------------------------------------------------------------
-- Sessões
-- -----------------------------------------------------------------------------
create table public.mentorias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  /* `restrict` e não `cascade`: apagar um mentor não pode evaporar as sessões
     que pessoas já marcaram na agenda. Quem quiser sumir com o mentor
     desativa (`ativo = false`) ou remove as sessões antes, conscientemente. */
  mentor_id uuid not null references public.mentores (id) on delete restrict,
  inicio timestamptz not null,
  fim timestamptz not null,
  vagas integer not null default 30,
  /* A sala de vídeo entra numa fase posterior; a coluna existe para a tela não
     precisar mudar de forma quando ela chegar. Nulo = "sala ainda não abriu". */
  sala_url text,
  status public.status_publicacao not null default 'rascunho',
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint mentorias_titulo_tamanho check (char_length(titulo) between 3 and 140),
  constraint mentorias_descricao_tamanho check (char_length(descricao) <= 2000),
  constraint mentorias_janela check (fim > inicio),
  constraint mentorias_vagas check (vagas between 1 and 1000)
);

-- -----------------------------------------------------------------------------
-- Check-in
--
-- NÃO EXISTE COLUNA `inscritos` NA SESSÃO, de propósito. Contador denormalizado
-- é um segundo lugar que precisa concordar com o primeiro, e a agenda inteira se
-- apoia nesse número — é ele que decide "lotada". Um contador que erra por um
-- exibe vaga onde não há.
-- -----------------------------------------------------------------------------
create table public.mentoria_inscricoes (
  mentoria_id uuid not null references public.mentorias (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),

  /* A chave composta é o que impede check-in duplicado — sem trigger, sem
     verificação no cliente, sem corrida. */
  primary key (mentoria_id, usuario_id)
);

-- -----------------------------------------------------------------------------
-- Índices — toda coluna de predicado de policy é indexada
-- -----------------------------------------------------------------------------
create index mentorias_status_inicio_idx on public.mentorias (status, inicio);
create index mentorias_mentor_id_idx on public.mentorias (mentor_id);
create index mentoria_inscricoes_usuario_id_idx on public.mentoria_inscricoes (usuario_id);

-- -----------------------------------------------------------------------------
-- atualizado_em
-- -----------------------------------------------------------------------------
create trigger mentores_atualizado_em
  before update on public.mentores
  for each row execute function private.tocar_atualizado_em();

create trigger mentorias_atualizado_em
  before update on public.mentorias
  for each row execute function private.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- Ocupação
--
-- O PROBLEMA QUE ESTA VIEW RESOLVE: quem consulta a agenda precisa saber se
-- ainda cabe, e NÃO pode saber quem está inscrito. A policy de
-- `mentoria_inscricoes` mostra à pessoa apenas a linha dela, então um
-- `count(*)` feito pelo cliente devolveria sempre 0 ou 1.
--
-- A view roda como DEFINIDOR (o padrão do Postgres para views), ou seja, ignora
-- a RLS da tabela de baixo — e é justamente por isso que ela expõe SÓ o
-- agregado. Não há coluna de identidade aqui: `usuario_id` não sai, não dá para
-- juntar com nada, e o máximo que se aprende é quantas vagas restam, que é
-- exatamente o que a agenda mostra.
-- -----------------------------------------------------------------------------
create view public.mentoria_ocupacao as
  select mentoria_id, count(*)::integer as inscritos
  from public.mentoria_inscricoes
  group by mentoria_id;

comment on view public.mentoria_ocupacao is
  'Agregado SEM identidade. Roda como definidor de propósito: a RLS de mentoria_inscricoes esconde as linhas dos outros, e sem isto ninguém saberia se a sessão está lotada. Nunca acrescente uma coluna que identifique quem se inscreveu.';

grant select on public.mentoria_ocupacao to authenticated;

-- -----------------------------------------------------------------------------
-- A REGRA DE NEGÓCIO MORA NO BANCO, não no cliente
--
-- Sem isto, "lotada" seria uma sugestão: duas pessoas clicando na última vaga no
-- mesmo segundo passariam as duas, porque cada uma contou antes de a outra
-- gravar. O `for update` na linha da sessão serializa os concorrentes — o
-- segundo espera o primeiro e recontagem já enxerga a inscrição dele.
-- -----------------------------------------------------------------------------
create function private.validar_inscricao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _vagas integer;
  _fim timestamptz;
  _status public.status_publicacao;
  _ocupadas integer;
begin
  select vagas, fim, status into _vagas, _fim, _status
  from public.mentorias
  where id = new.mentoria_id
  for update;

  if _vagas is null then
    raise exception 'mentoria inexistente' using errcode = '23503';
  end if;

  if _status <> 'publicado' then
    raise exception 'mentoria não publicada' using errcode = '23514';
  end if;

  /* Check-in depois do fim é sempre erro — inclusive para admin. O passado não
     recebe inscrição. */
  if now() >= _fim then
    raise exception 'mentoria encerrada' using errcode = '23514';
  end if;

  select count(*) into _ocupadas
  from public.mentoria_inscricoes
  where mentoria_id = new.mentoria_id;

  if _ocupadas >= _vagas then
    raise exception 'sem vagas' using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function private.validar_inscricao is
  'SECURITY DEFINER: precisa contar TODAS as inscrições da sessão, e a RLS da tabela mostra só a do próprio usuário. O `for update` na linha da mentoria é o que impede duas pessoas de levarem a mesma última vaga.';

create trigger mentoria_inscricoes_validar
  before insert on public.mentoria_inscricoes
  for each row execute function private.validar_inscricao();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.mentores enable row level security;
alter table public.mentorias enable row level security;
alter table public.mentoria_inscricoes enable row level security;

/* Mentor é dado público da plataforma — quem aparece na agenda aparece para
   todos os autenticados. Inativo continua visível porque as sessões passadas
   dele ainda mostram o nome; quem some da lista de escolha é decisão do admin. */
create policy "mentores são visíveis"
  on public.mentores for select to authenticated using (true);

create policy "mentores são escritos por admin"
  on public.mentores for insert to authenticated with check (private.eh_admin());
create policy "mentores são alterados por admin"
  on public.mentores for update to authenticated
  using (private.eh_admin()) with check (private.eh_admin());
create policy "mentores são removidos por admin"
  on public.mentores for delete to authenticated using (private.eh_admin());

create policy "mentorias publicadas são visíveis"
  on public.mentorias for select to authenticated
  using (status = 'publicado' or private.eh_admin());

create policy "mentorias são escritas por admin"
  on public.mentorias for insert to authenticated with check (private.eh_admin());
create policy "mentorias são alteradas por admin"
  on public.mentorias for update to authenticated
  using (private.eh_admin()) with check (private.eh_admin());
create policy "mentorias são removidas por admin"
  on public.mentorias for delete to authenticated using (private.eh_admin());

/* CADA UM VÊ A PRÓPRIA INSCRIÇÃO, e só. Nem admin: a lista de quem se inscreveu
   numa mentoria é dado de participação, e conceder leitura "por precaução" é
   como vazamento começa. Quando a chamada de presença existir, ela entra como
   uma função `security definer` com propósito declarado — não afrouxando isto.

   `(select auth.uid())` dentro de subquery: o Postgres promove a InitPlan e
   avalia uma vez por query em vez de uma por linha. */
create policy "inscrição é de quem se inscreveu"
  on public.mentoria_inscricoes for select to authenticated
  using (usuario_id = (select auth.uid()));

create policy "cada um se inscreve por si"
  on public.mentoria_inscricoes for insert to authenticated
  with check (usuario_id = (select auth.uid()));

/* Cancelar é apagar a própria linha. Não há `update`: uma inscrição não muda de
   estado, ela existe ou não. */
create policy "cada um cancela a própria inscrição"
  on public.mentoria_inscricoes for delete to authenticated
  using (usuario_id = (select auth.uid()));

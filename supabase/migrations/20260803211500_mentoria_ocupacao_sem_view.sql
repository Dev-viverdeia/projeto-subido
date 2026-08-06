-- =============================================================================
-- Ocupação: a view vira FUNÇÃO
--
-- A migration anterior resolvia "quantas vagas restam" com uma view que roda
-- como definidor. O escopo estava certo — só o agregado, sem `usuario_id`, nada
-- que identifique quem se inscreveu — mas o linter do Supabase marca qualquer
-- view definidora em `public` como ERROR (`security_definer_view`).
--
-- E ERRO PERMANENTE NO ADVISOR É PIOR QUE A VIEW: em duas semanas todo mundo
-- aprende que aquele item é "o de sempre", e o próximo achado de verdade entra
-- na mesma lista já ignorada. Um gate que sempre reprova deixa de ser gate — é a
-- mesma razão pela qual nenhuma regra de lint deste repo é `warn`.
--
-- A função tem EXATAMENTE a mesma exposição da view e o mesmo motivo para ser
-- definidora; a diferença é que ela declara isso no próprio corpo, e o advisor
-- volta a ficar limpo.
-- =============================================================================

drop view if exists public.mentoria_ocupacao;

create function public.mentoria_ocupacao(_ids uuid[])
returns table (mentoria_id uuid, inscritos integer)
language sql
stable
security definer
set search_path = ''
as $$
  select i.mentoria_id, count(*)::integer
  from public.mentoria_inscricoes i
  where i.mentoria_id = any(_ids)
  group by i.mentoria_id;
$$;

comment on function public.mentoria_ocupacao is
  'SECURITY DEFINER com escopo minimo: devolve so (mentoria_id, inscritos). Quem consulta a agenda precisa saber se ainda cabe e NAO pode saber quem esta inscrito. NUNCA acrescente aqui uma coluna que identifique participante.';

grant execute on function public.mentoria_ocupacao(uuid[]) to authenticated;

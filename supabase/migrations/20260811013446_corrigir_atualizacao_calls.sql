-- As tabelas de Calls usam `atualizada_em`, enquanto o trigger compartilhado
-- do restante da plataforma atualiza `atualizado_em`. A função específica
-- mantém o contrato já consumido pelo pós-call sem renomear colunas públicas.
create or replace function private.tocar_atualizada_em()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.atualizada_em := now();
  return new;
end;
$$;

revoke execute on function private.tocar_atualizada_em() from public;
revoke execute on function private.tocar_atualizada_em() from anon;
revoke execute on function private.tocar_atualizada_em() from authenticated;

drop trigger if exists calls_reunioes_atualizada_em on public.calls_reunioes;
create trigger calls_reunioes_atualizada_em
  before update on public.calls_reunioes
  for each row execute function private.tocar_atualizada_em();

drop trigger if exists calls_gravacoes_atualizada_em on public.calls_gravacoes;
create trigger calls_gravacoes_atualizada_em
  before update on public.calls_gravacoes
  for each row execute function private.tocar_atualizada_em();

drop trigger if exists calls_transcricoes_atualizada_em on public.calls_transcricoes;
create trigger calls_transcricoes_atualizada_em
  before update on public.calls_transcricoes
  for each row execute function private.tocar_atualizada_em();

drop trigger if exists calls_analises_atualizada_em on public.calls_analises;
create trigger calls_analises_atualizada_em
  before update on public.calls_analises
  for each row execute function private.tocar_atualizada_em();

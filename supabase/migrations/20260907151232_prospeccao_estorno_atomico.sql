-- A falha final e a devolução não podem ficar separadas por uma chamada de rede.
begin;
create function private.prospeccao_estornar_falha_final()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.tipo = 'prospeccao' and new.status = 'falhou' and old.status <> 'falhou'
     and new.referencia_tipo = 'prospeccao_lista' then
    perform public.prospeccao_sistema_falhar_lista(
      new.dono, new.referencia_id, coalesce(new.erro_mensagem, 'A busca não pôde ser concluída.')
    );
  end if;
  return new;
end;
$$;
revoke all on function private.prospeccao_estornar_falha_final() from public, anon, authenticated;
create trigger prospeccao_estorno_falha_final
  after update of status on public.operacoes_jobs
  for each row execute function private.prospeccao_estornar_falha_final();
commit;

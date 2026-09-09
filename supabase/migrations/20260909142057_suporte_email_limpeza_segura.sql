alter table public.suporte_arquivos_remover add column liberar_em timestamptz not null default now();
create function private.suporte_arquivo_confirmado() returns trigger language plpgsql security definer set search_path='' as $$
begin
  delete from public.suporte_arquivos_remover where caminho=new.caminho;
  return new;
end; $$;
revoke all on function private.suporte_arquivo_confirmado() from public,anon,authenticated;
create trigger suporte_arquivo_confirmado after insert on public.suporte_arquivos for each row execute function private.suporte_arquivo_confirmado();

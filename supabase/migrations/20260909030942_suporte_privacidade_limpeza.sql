-- Dados de acesso ficam restritos ao sistema; a equipe vê apenas o estado do envio.
revoke select on public.suporte_notificacoes from authenticated;
grant select(id,atendimento,evento,destinatario,tipo,estado,tentativas,provider_id,erro,criado_em,atualizado_em)
  on public.suporte_notificacoes to authenticated;

-- Fila durável para remover arquivos abandonados ou excluídos, sem perder tentativas.
create table public.suporte_arquivos_remover (
  caminho text primary key,
  criado_em timestamptz not null default now()
);
alter table public.suporte_arquivos_remover enable row level security;
revoke all on public.suporte_arquivos_remover from public,anon,authenticated;
grant all on public.suporte_arquivos_remover to service_role;
create function private.suporte_excluir_arquivo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.suporte_arquivos_remover(caminho) values(old.caminho) on conflict do nothing;
  return old;
end; $$;
revoke all on function private.suporte_excluir_arquivo() from public,anon,authenticated;
create trigger suporte_arquivo_excluido after delete on public.suporte_arquivos
  for each row execute function private.suporte_excluir_arquivo();

create function public.suporte_preparar_limpeza() returns void
language plpgsql security definer set search_path = '' as $$
begin
  -- O DELETE disputa o lock com a vinculação. Nunca remove arquivo já vinculado.
  delete from public.suporte_arquivos where id in (
    select id from public.suporte_arquivos where mensagem is null and criado_em < now()-interval '1 day'
    order by criado_em for update skip locked limit 50
  ) and mensagem is null;
  delete from public.suporte_atendimentos where id in (
    select id from public.suporte_atendimentos where dono is null and not verificado and acesso_expira_em < now()
    order by criado_em for update skip locked limit 50
  );
  delete from public.suporte_limites where chave in (
    select chave from public.suporte_limites where inicio < now()-interval '2 days' limit 500
  );
  update public.suporte_notificacoes set acesso_url=null where acesso_url is not null and criado_em < now()-interval '14 days';
end; $$;
revoke all on function public.suporte_preparar_limpeza() from public,anon,authenticated;
grant execute on function public.suporte_preparar_limpeza() to service_role;

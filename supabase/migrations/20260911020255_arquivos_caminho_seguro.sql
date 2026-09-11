begin;

-- A validação alcança o RPC existente e qualquer futura escrita privilegiada.
-- Não reescrevemos chaves antigas: os downloads também validam o caminho.
create function private.validar_caminho_arquivo_projeto() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_partes text[];
begin
  v_partes := string_to_array(new.caminho_storage, '/');
  if array_length(v_partes,1) <> 3
    or v_partes[1] is distinct from new.dono::text
    or v_partes[2] is distinct from new.projeto_execucao_id::text
    or v_partes[3] !~ '^[a-zA-Z0-9._-]+$'
    or v_partes[3] in ('.','..') then
    raise exception 'caminho_storage_invalido';
  end if;
  if not exists (select 1 from storage.objects
    where bucket_id='projeto-entregaveis' and name=new.caminho_storage
      and owner_id=new.dono::text) then
    raise exception 'arquivo_storage_indisponivel';
  end if;
  return new;
end; $$;
revoke all on function private.validar_caminho_arquivo_projeto() from public,anon,authenticated;
create trigger validar_caminho_arquivo_projeto
before insert or update of caminho_storage,dono,projeto_execucao_id on public.projeto_arquivos
for each row execute function private.validar_caminho_arquivo_projeto();

commit;

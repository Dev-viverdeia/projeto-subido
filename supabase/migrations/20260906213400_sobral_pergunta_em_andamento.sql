-- Impede que outra aba insira uma pergunta no meio da resposta atual.
-- O mesmo mutex do início da geração fecha a janela entre verificar e inserir.
create function private.sobral_proteger_pergunta()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.papel = 'usuario' then
    perform pg_advisory_xact_lock(hashtextextended(new.thread_id::text, 0));
    if exists (select 1 from public.sobral_geracoes
      where thread_id=new.thread_id and estado='gerando' and expira_em>now()) then
      raise exception using errcode='55000', message='Aguarde a resposta em andamento.';
    end if;
  end if;
  return new;
end; $$;
revoke all on function private.sobral_proteger_pergunta() from public, anon, authenticated;
create trigger sobral_pergunta_em_andamento before insert on public.consultor_mensagens
for each row execute function private.sobral_proteger_pergunta();

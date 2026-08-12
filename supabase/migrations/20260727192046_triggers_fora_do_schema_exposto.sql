-- =============================================================================
-- MOVER AS FUNÇÕES DE TRIGGER PARA `private`
--
-- Follow-up de 20260727191700 — aquela migration não é editada, porque já foi
-- aplicada e o histórico precisa bater com o que rodou no banco.
--
-- O QUE O LINTER DE SEGURANÇA DO SUPABASE PEGOU
-- `provisionar_novo_usuario()` e `tocar_atualizado_em()` nasceram no schema
-- `public`, que é o schema EXPOSTO pelo PostgREST. Toda função ali vira endpoint:
--
--   POST /rest/v1/rpc/provisionar_novo_usuario
--
-- E as duas são SECURITY DEFINER, isto é, rodam com os privilégios do dono
-- (postgres) em vez dos de quem chama. A combinação "exposta como RPC" + "roda
-- como superusuário" é a que vale a pena fechar, mesmo quando a chamada direta
-- falharia: uma função de trigger referencia `new`, que é nulo fora do contexto
-- de trigger, então hoje o resultado seria um erro. Isso é sorte de implementação,
-- não uma defesa — um `coalesce` acrescentado no futuro transformaria o erro em
-- execução bem-sucedida com privilégio total.
--
-- Mover para `private` resolve na raiz: o schema não é exposto, então não há
-- endpoint a chamar. Revogar EXECUTE também funcionaria, mas depende de ninguém
-- reconceder depois; um schema não exposto não tem esse modo de falha.
--
-- Os triggers continuam disparando normalmente: eles executam com os privilégios
-- do dono da tabela e não passam pelo grant de EXECUTE do chamador.
-- =============================================================================

-- Os triggers precisam sair antes das funções — a dependência impede o drop.
drop trigger if exists ao_criar_usuario on auth.users;
drop trigger if exists profiles_atualizado_em on public.profiles;

drop function if exists public.provisionar_novo_usuario();
drop function if exists public.tocar_atualizado_em();

create function private.tocar_atualizado_em()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create function private.provisionar_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'nome', ''), 80)
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, papel)
  values (new.id, 'membro')
  on conflict (user_id, papel) do nothing;

  return new;
end;
$$;

comment on function private.provisionar_novo_usuario is
  'Roda dentro da transação do signup. Os ON CONFLICT DO NOTHING existem porque um erro aqui reprova o cadastro inteiro com um 500 opaco.';

create trigger profiles_atualizado_em
  before update on public.profiles
  for each row execute function private.tocar_atualizado_em();

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function private.provisionar_novo_usuario();

-- Nenhum GRANT de EXECUTE aqui, de propósito: função de trigger não é chamada por
-- usuário. Os únicos grants em `private` continuam sendo os helpers de policy
-- (tem_papel, eh_admin), que a avaliação de RLS precisa poder executar.

-- Uma empresa pode aparecer uma única vez para o mesmo profissional, mesmo que
-- duas buscas concorrentes terminem ao mesmo tempo. A aplicação também elimina
-- domínio e identidade repetidos antes do enriquecimento; este trigger é a
-- última barreira atômica para a chave estável do provedor.

create index if not exists prospeccao_leads_dono_chave_idx
  on public.prospeccao_leads (dono, chave_externa);

create or replace function private.prospeccao_evitar_lead_repetido()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.prospeccao_leads
    where dono = new.dono
      and chave_externa = new.chave_externa
  ) then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists prospeccao_leads_sem_repeticao on public.prospeccao_leads;
create trigger prospeccao_leads_sem_repeticao
  before insert on public.prospeccao_leads
  for each row execute function private.prospeccao_evitar_lead_repetido();

-- Uma proposta aceita é a confirmação factual da venda. O CRM deve refletir
-- isso no mesmo commit, sem pedir que o profissional mova o card manualmente.
create function private.proposta_aceita_fechar_oportunidade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.crm_oportunidades
  set etapa = 'ganho',
      ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
  where id = new.oportunidade_id
    and dono = new.dono
    and etapa not in ('ganho', 'perdido');

  return new;
end;
$$;

revoke execute on function private.proposta_aceita_fechar_oportunidade() from public;
revoke execute on function private.proposta_aceita_fechar_oportunidade() from authenticated;

create trigger propostas_aceita_fecha_oportunidade
  after update of status on public.propostas
  for each row
  when (old.status is distinct from new.status and new.status = 'aceita')
  execute function private.proposta_aceita_fechar_oportunidade();

-- Reconcilia propostas já aceitas antes desta automação.
update public.crm_oportunidades oportunidade
set etapa = 'ganho',
    ordem = (extract(epoch from clock_timestamp()) * 1000)::bigint
from public.propostas proposta
where proposta.oportunidade_id = oportunidade.id
  and proposta.dono = oportunidade.dono
  and proposta.status = 'aceita'
  and oportunidade.etapa not in ('ganho', 'perdido');

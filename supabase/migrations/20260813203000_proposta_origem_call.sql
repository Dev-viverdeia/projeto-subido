-- A proposta já podia usar a análise de uma call, mas perdia a origem depois
-- de criada. O vínculo abaixo torna a proveniência navegável e impede que um
-- clique repetido gere dois rascunhos para a mesma conversa.

alter table public.propostas
  add column reuniao_id uuid references public.calls_reunioes (id) on delete set null;

create unique index propostas_reuniao_unica_idx
  on public.propostas (dono, reuniao_id)
  where reuniao_id is not null;

create index propostas_reuniao_fk_idx
  on public.propostas (reuniao_id)
  where reuniao_id is not null;

comment on column public.propostas.reuniao_id is
  'Call que forneceu os fatos para o primeiro rascunho da proposta.';

create function private.proposta_validar_reuniao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reuniao_id is not null
    and not exists (
      select 1
      from public.calls_reunioes reuniao
      where reuniao.id = new.reuniao_id
        and reuniao.dono = new.dono
        and reuniao.empresa_id = new.empresa_id
        and reuniao.oportunidade_id = new.oportunidade_id
    )
  then
    raise exception 'call_de_origem_invalida' using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke execute on function private.proposta_validar_reuniao() from public;
revoke execute on function private.proposta_validar_reuniao() from authenticated;

create trigger propostas_validar_reuniao
  before insert or update of reuniao_id, dono, empresa_id, oportunidade_id
  on public.propostas
  for each row execute function private.proposta_validar_reuniao();

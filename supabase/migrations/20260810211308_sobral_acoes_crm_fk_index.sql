-- Cobre a FK usada quando uma oportunidade é removida ou atualizada.
create index sobral_acoes_crm_oportunidade_fk_idx
  on public.sobral_acoes_crm (oportunidade_id);

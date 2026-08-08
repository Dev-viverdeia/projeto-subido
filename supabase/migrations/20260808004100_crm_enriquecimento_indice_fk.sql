-- A FK composta garante que a oportunidade pertence à mesma empresa e dono.
-- Este índice cobre exatamente essa verificação sem prejudicar o índice separado
-- usado para buscar o dossiê mais recente de uma oportunidade.
create index crm_enriquecimentos_oportunidade_fk_idx
  on public.crm_enriquecimentos (dono, empresa_id, oportunidade_id);

-- =============================================================================
-- CRM FACTUAL · ÍNDICES DAS RELAÇÕES
--
-- Índices compostos que acompanham exatamente as FKs de isolamento por dono.
-- Além das leituras, eles evitam varredura completa quando uma empresa, contato
-- ou oportunidade é removida por cascade na exclusão da conta.
-- =============================================================================

create index crm_oportunidades_contato_fk_idx
  on public.crm_oportunidades (dono, empresa_id, contato_principal_id);

create index crm_eventos_contato_fk_idx
  on public.crm_eventos (dono, empresa_id, contato_id);

create index crm_eventos_oportunidade_fk_idx
  on public.crm_eventos (dono, empresa_id, oportunidade_id);

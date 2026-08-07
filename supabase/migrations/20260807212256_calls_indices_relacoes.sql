-- Índices que cobrem exatamente as FKs compostas. Além do advisor, isto evita
-- varreduras completas quando empresa, contato, oportunidade ou reunião forem
-- removidos durante a exclusão de uma conta.

create index calls_reunioes_empresa_oportunidade_fk_idx
  on public.calls_reunioes (dono, empresa_id, oportunidade_id);
create index calls_reunioes_contato_fk_idx
  on public.calls_reunioes (dono, empresa_id, contato_id)
  where contato_id is not null;
create index calls_transcricoes_reuniao_fk_idx
  on public.calls_transcricoes (dono, reuniao_id);
create index calls_analises_reuniao_fk_idx
  on public.calls_analises (dono, reuniao_id);

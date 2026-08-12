-- O Plano Vivo e consultado em toda abertura de dossie, call e Sala de Entrega.
-- Este indice cobre a chave composta completa e evita varredura ao validar ou
-- remover a oportunidade pai.
create index projeto_acoes_oportunidade_fk_idx
  on public.projeto_acoes (dono, empresa_id, oportunidade_id);

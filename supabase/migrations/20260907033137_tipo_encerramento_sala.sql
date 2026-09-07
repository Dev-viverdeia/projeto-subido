-- Tipo separado: parar uma gravação não equivale a encerrar a sala.
alter type public.operacao_tipo add value if not exists 'encerramento_sala';

-- O Next já possui uma chave secreta server-only e consegue validar o código da
-- sala sem abrir nenhuma RPC privilegiada ao papel anônimo. Removemos as duas
-- funções públicas criadas na iteração anterior: o convite e o consentimento
-- passam pela rota /api/calls/token e a RLS continua fechada para o browser.

drop function if exists public.calls_registrar_entrada_publica(uuid, text, text, boolean);
drop function if exists public.calls_obter_convite(uuid);

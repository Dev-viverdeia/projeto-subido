-- =============================================================================
-- `mentoria_ocupacao` deixa de ser executável por quem não entrou
--
-- O DEFEITO, e ele é sutil: em Postgres, toda função nasce com `execute`
-- concedido ao papel `public` — que inclui `anon`. Escrever
-- `grant execute … to authenticated` ADICIONA uma permissão; não tira a que já
-- estava lá. O `grant` da migration anterior deu a impressão de restringir e não
-- restringiu nada.
--
-- Consequência concreta: `POST /rest/v1/rpc/mentoria_ocupacao` com uma lista de
-- ids, sem sessão nenhuma, devolveria quantas pessoas estão inscritas em cada
-- mentoria. Não vaza identidade — a função nunca devolve `usuario_id` —, mas
-- vaza operação: quanta gente a comunidade junta por sessão é informação de
-- negócio, e quem não entrou não tem por que tê-la.
--
-- Quem pegou foi o advisor do Supabase, não o build.
-- =============================================================================

revoke execute on function public.mentoria_ocupacao(uuid[]) from public;
revoke execute on function public.mentoria_ocupacao(uuid[]) from anon;

/* Reafirmado depois dos revokes — a ordem importa: um `revoke from public`
   depois do grant apagaria a concessão nominal em alguns cenários de herança. */
grant execute on function public.mentoria_ocupacao(uuid[]) to authenticated;

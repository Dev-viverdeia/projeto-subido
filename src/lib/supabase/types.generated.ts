/**
 * PLACEHOLDER — este arquivo ainda não foi gerado.
 *
 * Substituir por:
 *   npx supabase gen types typescript --project-id <ref> --schema public \
 *     > src/lib/supabase/types.generated.ts
 *
 * Existe agora para que a tipagem dos clientes seja real desde o primeiro dia: o
 * genérico `Database` já está aplicado em server.ts, client.ts e admin.ts, então
 * trocar este arquivo pelo gerado tipa a aplicação inteira sem tocar em mais nada.
 * Sem ele, o genérico cai no default `any` da lib e todo `.from(...)` fica sem tipo
 * em silêncio.
 *
 * Ignorado por eslint e prettier (ver eslint.config.mjs e .prettierignore): a
 * integridade de um arquivo gerado é o comando que o gera, não o formatador.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

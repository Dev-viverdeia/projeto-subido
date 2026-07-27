import '@testing-library/jest-dom/vitest';

/**
 * Env de teste.
 *
 * `src/lib/env.ts` valida na importação e LANÇA se faltar variável — que é o
 * comportamento desejado em produção e um problema em teste, onde qualquer módulo
 * que importe `env` transitivamente derrubaria a suíte inteira antes do primeiro
 * `expect`. Os valores abaixo são sintéticos e não apontam para projeto nenhum.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://projeto-de-teste.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= 'sb_publishable_teste';
process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000';

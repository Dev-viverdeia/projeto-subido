import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.110.9';
import { avancar } from './persistencia.ts';
import { gerarEGravar } from './gerar.ts';

Deno.test('worker duplicado/terminal não consulta ficha nem chama IA', async () => {
  let chamadas = 0;
  const client = {
    rpc: () => {
      chamadas++;
      return Promise.resolve({ data: false, error: null });
    },
  };
  await gerarEGravar(client as unknown as SupabaseClient, 'id', { oportunidade_id: 'op' }, 'teste');
  if (chamadas !== 1) throw new Error('Worker não parou no claim recusado.');
});

Deno.test(
  'a persistência exige confirmação explícita e não expõe a credencial no erro',
  async () => {
    const client = {
      rpc: () =>
        Promise.resolve({ data: null, error: { code: '42501', message: 'segredo-nao-publicar' } }),
    };
    try {
      await avancar(client as unknown as SupabaseClient, 'id', 'segredo-nao-publicar', 'ler_site');
      throw new Error('deveria_falhar');
    } catch (erro) {
      if (!(erro instanceof Error) || erro.message !== 'persistencia_enriquecimento:42501')
        throw erro;
    }
  },
);

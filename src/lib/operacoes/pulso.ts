import 'server-only';
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';

/** A observação não repete o trabalho nem impede as outras filas. */
export async function observarSuporte<T>(
  fase: 'recebimento' | 'envio' | 'limpeza',
  executar: () => Promise<T>,
  temFalhas: (resultado: T) => boolean = () => false,
) {
  const inicio = new Date().toISOString();
  let falhou = true;
  try {
    const resultado = await executar();
    falhou = temFalhas(resultado);
    return resultado;
  } finally {
    try {
      const { error } = await createAdminClient({ timeoutMs: 3000 }).rpc(
        'operacoes_registrar_pulso',
        {
          p_fase: fase,
          p_inicio: inicio,
          p_falhou: falhou,
        },
      );
      if (error) console.error('[operacoes:pulso] Verificação não confirmada.', fase);
    } catch {
      // Se não confirmar, o painel mostra o recibo antigo/ausente, nunca sucesso inventado.
      console.error('[operacoes:pulso] Não foi possível confirmar a verificação.', fase);
    }
  }
}

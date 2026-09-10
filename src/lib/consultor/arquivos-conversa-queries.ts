import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { termoHistorico } from './historico-contrato';
import {
  TAMANHO_PAGINA_ARQUIVOS,
  type ArquivoDaConversa,
  type PaginaArquivosConversa,
} from './arquivos-conversa-contrato';

export async function obterArquivosConversa(
  conversa: string,
  donoEsperado: string,
  busca = '',
  pagina = 0,
): Promise<PaginaArquivosConversa | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const dono = data?.claims.sub;
  if (!dono || dono !== donoEsperado) return null;
  // O dono vem da sessão. O filtro enviado pelo navegador só detecta troca de conta.
  // A lista não entrega paths, URLs assinadas, transcrições ou conteúdo das mensagens.
  let query = supabase
    .from('consultor_anexos')
    .select(
      'id,nome,tipo_mime,tamanho_bytes,categoria,mensagem_id,criado_em,consultor_mensagens!inner(thread_id)',
      { count: 'exact' },
    )
    .eq('dono', dono)
    .eq('consultor_mensagens.thread_id', conversa)
    .order('criado_em', { ascending: false })
    .order('id', { ascending: true });
  if (busca) query = query.ilike('nome', termoHistorico(busca));
  const inicio = pagina * TAMANHO_PAGINA_ARQUIVOS;
  const {
    data: rows,
    count,
    error,
  } = await query.range(inicio, inicio + TAMANHO_PAGINA_ARQUIVOS - 1);
  if (error) throw new Error('Falha ao consultar arquivos');
  return {
    arquivos: (rows ?? []).map((a) => ({
      id: a.id,
      nome: a.nome,
      tipoMime: a.tipo_mime,
      tamanhoBytes: Number(a.tamanho_bytes),
      categoria: a.categoria as ArquivoDaConversa['categoria'],
      mensagemId: a.mensagem_id,
      criadoEm: a.criado_em,
    })),
    total: count ?? 0,
    mais: inicio + TAMANHO_PAGINA_ARQUIVOS < (count ?? 0),
  };
}

import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/types.generated';
import { criarAdminSobral } from './admin';
import { resolverRecomendacoes } from './conteudo';
import { ErroSobral } from './erro';
import { GeracaoSobralSchema, type EventoSobral, type GeracaoSobral } from './geracao-contrato';
import { prepararAnexosParaModelo } from './processar-anexos';
import { direcaoDaMensagem, persistirPlanoSobral, produzirLeituraSobral } from './servico';
import { revalidarDirecaoOperacional } from './revalidacao';

/** O recibo sincroniza stream, recarga e pedido de parar. */
export async function executarGeracao({
  supabase,
  dono,
  geracao,
  controle,
  emitir,
}: {
  supabase: SupabaseClient<Database>;
  dono: string;
  geracao: GeracaoSobral;
  controle: AbortController;
  emitir: (evento: EventoSobral) => void;
}): Promise<GeracaoSobral | null> {
  const admin = criarAdminSobral();
  let texto = '';
  let tokens: number | null = null;
  let leitura: Awaited<ReturnType<typeof produzirLeituraSobral>> | undefined;
  let preparados: Awaited<ReturnType<typeof prepararAnexosParaModelo>> | undefined;
  let estado: 'concluida' | 'interrompida' | 'falhou';
  let erro: string | null = null;
  let sincronizando: Promise<void> | null = null;
  const { signal } = controle;
  const prazo = setTimeout(() => controle.abort('prazo'), 135_000);
  const sincronizar = async () => {
    const { data, error } = await admin
      .from('sobral_geracoes')
      .update({ texto })
      .eq('mensagem_id', geracao.mensagem_id)
      .eq('dono', dono)
      .eq('tentativa', geracao.tentativa)
      .eq('estado', 'gerando')
      .select('parar_em')
      .maybeSingle();
    if (error || !data || data.parar_em) controle.abort(data?.parar_em ? 'usuario' : 'recibo');
  };
  const pulso = setInterval(() => {
    if (!sincronizando)
      sincronizando = sincronizar()
        .catch(() => controle.abort('recibo'))
        .finally(() => {
          sincronizando = null;
        });
  }, 1500);

  try {
    signal.throwIfAborted();
    const { data: ultimas, error } = await supabase
      .from('consultor_mensagens')
      .select(
        'id, papel, conteudo, criado_em, contexto_anexos, consultor_anexos(id, nome, tipo_mime, categoria, caminho_storage, transcricao)',
      )
      .eq('thread_id', geracao.thread_id)
      .order('criado_em', { ascending: false })
      .order('id', { ascending: false })
      .limit(20);
    if (error) throw error;
    const indice = ultimas?.findIndex((m) => m.id === geracao.mensagem_id) ?? -1;
    if (!ultimas || indice < 0) throw new Error('pergunta-indisponivel');
    const pergunta = ultimas[indice];
    if (!pergunta) throw new Error('pergunta-indisponivel');
    const historico = ultimas
      .slice(indice)
      .reverse()
      .map((m) => ({
        papel: m.papel as 'usuario' | 'consultor',
        conteudo: m.contexto_anexos
          ? `${m.conteudo}\n\nContexto preservado dos arquivos enviados:\n${m.contexto_anexos}`
          : m.conteudo,
      }));
    const anexos = (pergunta.consultor_anexos ?? []).map((a) => ({
      id: a.id,
      nome: a.nome,
      tipoMime: a.tipo_mime,
      categoria: a.categoria as 'imagem' | 'documento' | 'audio',
      caminhoStorage: a.caminho_storage,
      transcricao: a.transcricao,
    }));
    emitir({ tipo: 'etapa', etapa: anexos.length ? 'lendo' : 'pensando' });
    preparados = await prepararAnexosParaModelo(admin, anexos, signal);
    for (const transcricao of preparados.transcricoes) {
      const { error: erroTranscricao } = await admin
        .from('consultor_anexos')
        .update({ transcricao: transcricao.texto.slice(0, 24000) })
        .eq('id', transcricao.id)
        .eq('dono', dono);
      if (erroTranscricao) throw erroTranscricao;
    }
    signal.throwIfAborted();
    emitir({ tipo: 'etapa', etapa: 'pensando' });
    leitura = await produzirLeituraSobral({
      supabase,
      usuarioId: dono,
      historico,
      pedido: pergunta.conteudo,
      anexos: preparados.entradas,
      fluxo: {
        signal,
        aoTexto: (atual) => {
          texto = atual;
          emitir({ tipo: 'texto', texto });
        },
        aoUso: (uso) => {
          tokens = uso;
        },
      },
    });
    tokens = leitura.rodada.tokens;
    signal.throwIfAborted();
    texto = leitura.rodada.direcao.resposta;
    estado = 'concluida';
    emitir({ tipo: 'etapa', etapa: 'finalizando' });
  } catch (causa) {
    estado = signal.aborted ? 'interrompida' : 'falhou';
    erro = signal.aborted
      ? 'Resposta interrompida.'
      : causa instanceof ErroSobral
        ? causa.message
        : 'Não consegui concluir a resposta. Tente novamente.';
    if (!signal.aborted)
      console.error('[sobral:geracao] falha', causa instanceof Error ? causa.name : 'desconhecida');
  } finally {
    clearTimeout(prazo);
    clearInterval(pulso);
    await (sincronizando as Promise<void> | null);
  }
  // Repetir o mesmo payload após perda de ACK não repete resposta nem contabilização.
  const dados: Json = {
    texto,
    tokens,
    erro,
    ...(leitura
      ? {
          cartoes: resolverRecomendacoes(
            leitura.rodada.direcao.recomendacoes,
            leitura.sinais,
          ) as unknown as Json,
          direcao: direcaoDaMensagem(leitura),
          modelo: leitura.rodada.modelo,
          contexto_anexos: leitura.rodada.direcao.memoria_anexos,
        }
      : {}),
  };
  let recibo: GeracaoSobral | null = null;
  try {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const { data, error } = await admin.rpc('sobral_finalizar_geracao', {
        p_dono: dono,
        p_mensagem: geracao.mensagem_id,
        p_tentativa: geracao.tentativa,
        p_estado: estado,
        p_dados: dados,
      });
      if (!error) {
        recibo = GeracaoSobralSchema.parse(data);
        break;
      }
      console.error('[sobral:recibo] confirmação pendente', error.code);
    }
    if (!recibo) {
      emitir({
        tipo: 'erro',
        mensagem: 'Conferindo se a resposta foi salva. Não é preciso reenviar a pergunta.',
      });
      return null;
    }
    emitir({ tipo: 'estado', geracao: recibo });
    if (recibo.estado === 'concluida' && leitura)
      await persistirPlanoSobral(admin, dono, leitura).catch(() =>
        console.error('[sobral:plano] atualização pendente'),
      );
    revalidarDirecaoOperacional();
    return recibo;
  } finally {
    await preparados?.limpar();
  }
}

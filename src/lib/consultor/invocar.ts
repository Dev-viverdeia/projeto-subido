'use client';

import { z } from 'zod';

import { GeracaoSobralSchema, type EventoSobral, type GeracaoSobral } from './geracao-contrato';
import { lerFluxoSobral } from './ler-fluxo';

export type FalhaDoConsultor = { mensagem: string; tipo?: string };
export type RespostaDoConsultor = { thread_id: string; resposta: string };
type Resultado =
  { dados: RespostaDoConsultor; falha: null } | { dados: null; falha: FalhaDoConsultor };
export type OpcoesResposta = {
  mensagemId: string;
  tentativa: string;
  repetir?: boolean;
  somenteConferir?: boolean;
  signal: AbortSignal;
  aoEvento: (evento: EventoSobral) => void;
  aoConferir?: () => void;
};
const URL_RESPOSTA = '/api/consultor/responder';
const CorpoGeracao = z.object({ geracao: GeracaoSobralSchema });

async function mensagemDoCorpo(response: Response) {
  const dados = z.object({ erro: z.string() }).safeParse(await response.json().catch(() => null));
  return dados.success ? dados.data.erro : 'Não foi possível responder agora.';
}

export async function pararResposta(geracao: GeracaoSobral): Promise<GeracaoSobral> {
  const response = await fetch(URL_RESPOSTA, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ mensagem_id: geracao.mensagem_id, tentativa: geracao.tentativa }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(await mensagemDoCorpo(response));
  return CorpoGeracao.parse(await response.json()).geracao;
}

function resultado(geracao: GeracaoSobral): Resultado {
  return geracao.estado === 'concluida'
    ? { dados: { thread_id: geracao.thread_id, resposta: geracao.texto }, falha: null }
    : {
        dados: null,
        falha: { mensagem: geracao.erro ?? 'Resposta interrompida.', tipo: geracao.estado },
      };
}

function esperar(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Interrompido', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancelar);
      resolve();
    }, 1500);
    const cancelar = () => {
      clearTimeout(timer);
      reject(new DOMException('Interrompido', 'AbortError'));
    };
    signal.addEventListener('abort', cancelar, { once: true });
  });
}

/** Nunca repete o POST após uma falha ambígua: consulta o recibo da mesma pergunta. */
export async function responderPendente(
  threadId: string,
  opcoes: OpcoesResposta,
): Promise<Resultado> {
  let geracao: GeracaoSobral | null = null;
  const receber = (evento: EventoSobral) => {
    if (evento.tipo === 'estado') {
      if (evento.geracao.thread_id !== threadId || evento.geracao.mensagem_id !== opcoes.mensagemId)
        throw new Error('recibo-invalido');
      geracao = evento.geracao;
    }
    opcoes.aoEvento(evento);
  };
  try {
    if (!opcoes.somenteConferir) {
      const response = await fetch(URL_RESPOSTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify({
          thread_id: threadId,
          mensagem_id: opcoes.mensagemId,
          tentativa: opcoes.tentativa,
          pendente: true,
          repetir: opcoes.repetir ?? false,
        }),
        cache: 'no-store',
        signal: AbortSignal.any([opcoes.signal, AbortSignal.timeout(175_000)]),
      });
      if (!response.ok) {
        if (response.status < 500 && response.status !== 409)
          return {
            dados: null,
            falha: {
              mensagem: await mensagemDoCorpo(response),
              tipo: response.status === 401 ? 'sessao' : 'recusada',
            },
          };
        throw new Error('conferir-recibo');
      }
      if (response.headers.get('content-type')?.includes('application/x-ndjson'))
        await lerFluxoSobral(response, receber);
      else
        receber({
          tipo: 'estado',
          geracao: CorpoGeracao.parse(await response.json()).geracao,
        });
    }
  } catch {
    if (opcoes.signal.aborted)
      return { dados: null, falha: { mensagem: 'Resposta interrompida.', tipo: 'interrompida' } };
  }
  // A atribuição vem do callback de streaming; TypeScript não acompanha a mutação.
  let atual = geracao as GeracaoSobral | null;
  if (atual && atual.estado !== 'gerando') return resultado(atual);
  opcoes.aoConferir?.();
  const limite = Date.now() + 250_000;
  let falhas = 0;
  let ausentes = 0;
  while (!opcoes.signal.aborted && Date.now() < limite) {
    try {
      const response = await fetch(
        `${URL_RESPOSTA}?mensagem_id=${encodeURIComponent(opcoes.mensagemId)}`,
        {
          cache: 'no-store',
          signal: AbortSignal.any([opcoes.signal, AbortSignal.timeout(12_000)]),
        },
      );
      if (response.status === 401)
        return {
          dados: null,
          falha: { mensagem: 'Entre novamente para conferir sua resposta.', tipo: 'sessao' },
        };
      if (response.status === 404 && ++ausentes >= 3)
        return {
          dados: null,
          falha: {
            mensagem: 'A resposta não chegou a iniciar. Sua pergunta está salva.',
            tipo: 'nao_iniciada',
          },
        };
      if (!response.ok) throw new Error('conexao');
      atual = CorpoGeracao.parse(await response.json()).geracao;
      receber({ tipo: 'estado', geracao: atual });
      if (atual.estado !== 'gerando') return resultado(atual);
      falhas = 0;
    } catch {
      if (++falhas >= 3) break;
    }
    try {
      await esperar(opcoes.signal);
    } catch {
      break;
    }
  }
  return {
    dados: null,
    falha: { mensagem: 'Não foi possível confirmar a resposta.', tipo: 'pendente' },
  };
}

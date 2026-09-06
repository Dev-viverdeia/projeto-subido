'use client';

import { useEffect, useRef, useState } from 'react';
import { pararResposta, responderPendente } from '@/lib/consultor/invocar';
import type { GeracaoSobral } from '@/lib/consultor/geracao-contrato';

export function useRespostaSobral() {
  const controle = useRef<AbortController | null>(null);
  const [texto, setTexto] = useState<string | null>(null);
  const [geracao, setGeracao] = useState<GeracaoSobral | null>(null);
  const [etapa, setEtapa] = useState<'lendo' | 'pensando' | 'finalizando' | null>(null);
  const [parando, setParando] = useState(false);
  const [erroParar, setErroParar] = useState<string | null>(null);
  useEffect(() => () => controle.current?.abort(), []);

  async function responder(
    threadId: string,
    mensagemId: string,
    repetir = false,
    somenteConferir = false,
  ) {
    controle.current?.abort();
    const atual = new AbortController();
    controle.current = atual;
    setParando(false);
    setErroParar(null);
    setEtapa('pensando');
    if (!somenteConferir) {
      setTexto(null);
      setGeracao(null);
    }
    const resultado = await responderPendente(threadId, {
      mensagemId,
      tentativa: crypto.randomUUID(),
      repetir,
      somenteConferir,
      signal: atual.signal,
      aoEvento: (evento) => {
        if (atual.signal.aborted) return;
        if (evento.tipo === 'texto') setTexto(evento.texto);
        if (evento.tipo === 'etapa') setEtapa(evento.etapa);
        if (evento.tipo === 'estado') {
          setGeracao(evento.geracao);
          if (evento.geracao.texto) setTexto(evento.geracao.texto);
          setParando(evento.geracao.estado === 'gerando' && Boolean(evento.geracao.parar_em));
        }
      },
    });
    if (atual.signal.aborted) return null;
    if (resultado.dados) setTexto(resultado.dados.resposta);
    setEtapa(null);
    setParando(false);
    return resultado;
  }

  async function parar() {
    if (!geracao || parando) return;
    setParando(true);
    setErroParar(null);
    try {
      const recibo = await pararResposta(geracao);
      setGeracao(recibo);
      // O stream (ou a consulta do recibo) confirma o encerramento efetivo.
    } catch {
      setParando(false);
      setErroParar('Não consegui confirmar a interrupção. Tente parar novamente.');
    }
  }

  return {
    texto,
    etapa,
    parando,
    erroParar,
    geracao,
    responder,
    parar,
    limpar: () => {
      setTexto(null);
      setGeracao(null);
      setErroParar(null);
    },
  };
}

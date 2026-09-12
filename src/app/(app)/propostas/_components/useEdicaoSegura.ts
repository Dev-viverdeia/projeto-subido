'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EdicaoPropostaSchema, mesmoConteudo, type EdicaoProposta } from '@/lib/propostas/edicao';
import type { EstadoProposta } from '@/lib/propostas/actions';

export function useEdicaoSegura(
  inicial: EdicaoProposta,
  versaoAtual: number,
  aplicar: (edicao: EdicaoProposta) => void,
  antesAtualizar: () => void,
) {
  const [base, setBase] = useState(inicial);
  const [remota, setRemota] = useState<EdicaoProposta | null>(null);
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [mudouNovamente, setMudouNovamente] = useState(false);
  const controle = useRef({ geracao: 0, mutacoes: 0, abort: null as AbortController | null });

  const interromper = useCallback(() => {
    controle.current.geracao += 1;
    controle.current.abort?.abort();
    controle.current.abort = null;
  }, []);

  const consultar = useCallback(async () => {
    if (controle.current.mutacoes) return;
    interromper();
    const geracao = controle.current.geracao;
    const abort = new AbortController();
    controle.current.abort = abort;
    setConsultando(true);
    const timeout = setTimeout(() => abort.abort(), 12_000);
    try {
      const response = await fetch(`/api/propostas/${base.id}/edicao`, {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: abort.signal,
      });
      if (response.status === 401)
        throw new Error('Entre novamente em outra aba para conferir a versão.');
      if ([403, 404].includes(response.status))
        throw new Error('O acesso à proposta mudou. Sua edição continua aqui.');
      if (!response.ok)
        throw new Error('Não foi possível conferir a versão salva. Tente novamente.');
      const atual = EdicaoPropostaSchema.parse(await response.json());
      if (atual.id !== base.id || atual.versao < versaoAtual)
        throw new Error('A versão está sendo atualizada. Tente novamente.');
      if (geracao !== controle.current.geracao || abort.signal.aborted) return;
      antesAtualizar();
      setErro(null);
      if (mesmoConteudo(base, atual)) {
        // Uma decisão do cliente não substitui o documento nem interrompe o rascunho local.
        setBase(atual);
        setRemota(null);
      } else {
        setRemota(atual);
      }
    } catch (falha) {
      if (geracao === controle.current.geracao) {
        antesAtualizar();
        const mensagens = [
          'Entre novamente em outra aba para conferir a versão.',
          'O acesso à proposta mudou. Sua edição continua aqui.',
          'A versão está sendo atualizada. Tente novamente.',
        ];
        setErro(
          falha instanceof Error && mensagens.includes(falha.message)
            ? falha.message
            : 'Não foi possível conferir a versão salva. Tente novamente.',
        );
      }
    } finally {
      clearTimeout(timeout);
      if (geracao === controle.current.geracao) {
        controle.current.abort = null;
        setConsultando(false);
      }
    }
  }, [antesAtualizar, base, interromper, versaoAtual]);

  useEffect(() => {
    let encerrado = false;
    if (!aberto && versaoAtual > Math.max(base.versao, remota?.versao ?? 0)) {
      queueMicrotask(() => {
        if (!encerrado) void consultar();
      });
    }
    return () => {
      encerrado = true;
      interromper();
    };
  }, [aberto, base.versao, consultar, interromper, remota?.versao, versaoAtual]);

  function iniciar() {
    controle.current.mutacoes += 1;
    interromper();
    setConsultando(false);
    setErro(null);
  }

  function concluir(resultado?: EstadoProposta) {
    controle.current.mutacoes = Math.max(0, controle.current.mutacoes - 1);
    antesAtualizar();
    if (resultado?.conflito) {
      setMudouNovamente(aberto);
      setRemota(resultado.conflito);
      setAberto(true);
    } else if (resultado?.sucesso && resultado.versao) {
      setBase(
        (atual) =>
          resultado.edicao ?? {
            ...atual,
            versao: resultado.versao!,
            status: resultado.status ?? atual.status,
          },
      );
      setRemota(null);
      setAberto(false);
      setErro(null);
    } else if (resultado?.erro && aberto) {
      setErro(resultado.erro);
    }
  }

  function usarSalva() {
    if (!remota) return;
    interromper();
    aplicar(remota);
    setBase(remota);
    setRemota(null);
    setAberto(false);
    setErro(null);
  }

  return {
    base,
    remota,
    aberto,
    erro,
    consultando,
    mudouNovamente,
    bloqueado: versaoAtual > base.versao || Boolean(remota),
    iniciar,
    concluir,
    usarSalva,
    abrir: () => {
      setMudouNovamente(false);
      setAberto(true);
    },
    fechar: () => setAberto(false),
    tentar: () => {
      void consultar();
    },
    recuperarBase: (anterior: EdicaoProposta) => {
      interromper();
      const atual = remota ?? base;
      const mudou = !mesmoConteudo(anterior, atual);
      setBase(mudou ? anterior : atual);
      setRemota(mudou ? atual : null);
      setErro(null);
      setAberto(false);
    },
  };
}

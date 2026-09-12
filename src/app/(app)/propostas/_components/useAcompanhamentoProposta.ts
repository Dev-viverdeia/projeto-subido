'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AcompanhamentoPropostaSchema,
  avisoDeAtualizacao,
  type AcompanhamentoProposta,
} from '@/lib/propostas/acompanhamento';
import type { EstadoProposta } from '@/lib/propostas/actions';
import type { EstadoCompartilhamento } from '@/lib/propostas/compartilhamento-actions';

type Falha = 'offline' | 'temporaria' | 'sessao' | 'acesso' | null;
type Confirmacao = EstadoProposta & EstadoCompartilhamento;

export function useAcompanhamentoProposta(
  inicial: AcompanhamentoProposta,
  ativo = true,
  antesAtualizar?: () => void,
) {
  const [leitura, setLeitura] = useState({
    dados: inicial,
    aviso: null as string | null,
    falha: null as Falha,
  });
  const [consultando, setConsultando] = useState(false);
  const atualizarLeitura = useCallback(
    (mudar: (atual: typeof leitura) => typeof leitura) => {
      antesAtualizar?.();
      setLeitura(mudar);
    },
    [antesAtualizar],
  );
  const mutacoes = useRef(0);
  const controle = useRef<{
    interromper: () => void;
    consultar: (manual?: boolean) => void;
  } | null>(null);

  useEffect(() => {
    if (!ativo) return;
    let encerrado = false;
    let geracao = 0;
    let falhas = 0;
    let acessoInterrompido = false;
    let ultimaConsulta = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let requisicao: AbortController | null = null;

    function interromper() {
      geracao += 1;
      clearTimeout(timer);
      requisicao?.abort();
      requisicao = null;
    }

    function agendar(espera = Math.min(30_000 * 2 ** falhas, 120_000)) {
      clearTimeout(timer);
      if (
        !encerrado &&
        !acessoInterrompido &&
        !mutacoes.current &&
        navigator.onLine &&
        document.visibilityState === 'visible'
      ) {
        timer = setTimeout(() => {
          void consultar();
        }, espera);
      }
    }

    async function consultar(manual = false) {
      if (encerrado || requisicao || mutacoes.current || document.visibilityState !== 'visible')
        return;
      if (!navigator.onLine) {
        atualizarLeitura((atual) => ({ ...atual, falha: 'offline' }));
        return;
      }
      if (acessoInterrompido && !manual) return;
      if (!manual && Date.now() - ultimaConsulta < 5_000) {
        agendar(5_000 - (Date.now() - ultimaConsulta));
        return;
      }
      clearTimeout(timer);
      ultimaConsulta = Date.now();
      const rodada = ++geracao;
      const abort = new AbortController();
      requisicao = abort;
      setConsultando(true);
      const timeout = setTimeout(() => abort.abort(), 12_000);
      try {
        const response = await fetch(`/api/propostas/${inicial.id}/acompanhamento`, {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: abort.signal,
        });
        if (encerrado || rodada !== geracao) return;
        if ([401, 403, 404].includes(response.status)) {
          acessoInterrompido = true;
          atualizarLeitura((atual) => ({
            ...atual,
            falha: response.status === 401 ? 'sessao' : 'acesso',
          }));
          return;
        }
        if (!response.ok) throw new Error('acompanhamento_indisponivel');
        const dados = AcompanhamentoPropostaSchema.parse(await response.json());
        if (dados.id !== inicial.id) throw new Error('proposta_diferente');
        if (encerrado || rodada !== geracao || abort.signal.aborted) return;
        falhas = 0;
        acessoInterrompido = false;
        atualizarLeitura((atual) =>
          dados.versao < atual.dados.versao
            ? { ...atual, falha: null }
            : {
                dados,
                falha: null,
                aviso: avisoDeAtualizacao(atual.dados, dados) ?? atual.aviso,
              },
        );
      } catch {
        if (!encerrado && rodada === geracao) {
          falhas += 1;
          atualizarLeitura((atual) => ({
            ...atual,
            falha: navigator.onLine ? 'temporaria' : 'offline',
          }));
        }
      } finally {
        clearTimeout(timeout);
        if (!encerrado && rodada === geracao) {
          requisicao = null;
          setConsultando(false);
          agendar();
        }
      }
    }

    function ambienteMudou() {
      if (!navigator.onLine || document.visibilityState !== 'visible') {
        interromper();
        setConsultando(false);
        if (!navigator.onLine) atualizarLeitura((atual) => ({ ...atual, falha: 'offline' }));
      } else {
        void consultar();
      }
    }

    controle.current = {
      interromper: () => {
        interromper();
        setConsultando(false);
      },
      consultar: (manual = false) => {
        void consultar(manual);
      },
    };
    agendar();
    window.addEventListener('online', ambienteMudou);
    window.addEventListener('offline', ambienteMudou);
    window.addEventListener('focus', ambienteMudou);
    document.addEventListener('visibilitychange', ambienteMudou);
    // Também sinaliza a abertura da tela já sem conexão, depois da hidratação.
    queueMicrotask(() => {
      if (!encerrado && !navigator.onLine) ambienteMudou();
    });
    return () => {
      encerrado = true;
      interromper();
      controle.current = null;
      window.removeEventListener('online', ambienteMudou);
      window.removeEventListener('offline', ambienteMudou);
      window.removeEventListener('focus', ambienteMudou);
      document.removeEventListener('visibilitychange', ambienteMudou);
    };
  }, [inicial.id, ativo, atualizarLeitura]);

  const iniciarAlteracao = useCallback(() => {
    mutacoes.current += 1;
    controle.current?.interromper();
  }, []);

  const concluirAlteracao = useCallback(
    (resultado?: Confirmacao) => {
      if (resultado?.sucesso) {
        atualizarLeitura((atual) => {
          const compartilhamento = { ...atual.dados.compartilhamento };
          if (resultado.compartilhamentoCodigo) {
            Object.assign(compartilhamento, {
              codigo: resultado.compartilhamentoCodigo,
              ativo: true,
            });
            if (resultado.status === 'apresentada') {
              Object.assign(compartilhamento, {
                visualizacoes: 0,
                primeiraVisualizacaoEm: null,
                ultimaVisualizacaoEm: null,
                decisaoNome: null,
                decisaoEmail: null,
                decisaoComentario: null,
                decididaEm: null,
              });
            }
          }
          if (resultado.codigo !== undefined) compartilhamento.codigo = resultado.codigo;
          if (resultado.ativo !== undefined) compartilhamento.ativo = resultado.ativo;
          if (resultado.status === 'rascunho' || resultado.status === 'pronta')
            compartilhamento.ativo = false;
          return {
            dados: {
              ...atual.dados,
              status: resultado.status ?? atual.dados.status,
              versao: resultado.versao ?? atual.dados.versao,
              compartilhamento,
            },
            falha: null,
            aviso: null,
          };
        });
      }
      mutacoes.current = Math.max(0, mutacoes.current - 1);
      // Invalida qualquer leitura anterior à mutação, inclusive quando o resultado é incerto.
      if (!mutacoes.current) controle.current?.consultar(true);
    },
    [atualizarLeitura],
  );

  const tentarNovamente = useCallback(() => controle.current?.consultar(true), []);
  const dispensarAviso = useCallback(
    () => atualizarLeitura((atual) => ({ ...atual, aviso: null })),
    [atualizarLeitura],
  );
  return {
    ...leitura,
    consultando,
    iniciarAlteracao,
    concluirAlteracao,
    tentarNovamente,
    dispensarAviso,
  };
}

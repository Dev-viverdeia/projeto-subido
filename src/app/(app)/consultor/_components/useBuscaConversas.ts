'use client';
import { useEffect, useRef, useState } from 'react';
import type { PaginaConversas } from '@/lib/consultor/historico-contrato';

export function useBuscaConversas(inicial: PaginaConversas, dono?: string) {
  const [busca, setBusca] = useState('');
  const [pedido, setPedido] = useState({ termo: '', pagina: 0, versao: 0 });
  const [resultado, setResultado] = useState<PaginaConversas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const numero = useRef(0);
  useEffect(() => {
    if (!pedido.termo && pedido.pagina === 0 && pedido.versao === 0) return;
    const controller = new AbortController();
    const versao = ++numero.current;
    const executar = async () => {
      let mensagemErro = 'Não foi possível buscar. Tente novamente.';
      try {
        const query = new URLSearchParams({
          busca: pedido.termo,
          pagina: String(pedido.pagina),
          dono: dono ?? '',
        });
        const resposta = await fetch(`/api/consultor/conversas?${query}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!resposta.ok) {
          if (resposta.status === 401) mensagemErro = 'Entre novamente na mesma conta.';
          throw new Error(mensagemErro);
        }
        const data = (await resposta.json()) as PaginaConversas;
        if (versao !== numero.current || controller.signal.aborted) return;
        setResultado((anterior) => ({
          ...data,
          threads:
            pedido.pagina > 0
              ? [
                  ...new Map(
                    [...(anterior ?? inicial).threads, ...data.threads].map((t) => [t.id, t]),
                  ).values(),
                ]
              : data.threads,
        }));
      } catch {
        if (controller.signal.aborted || versao !== numero.current) return;
        setErro(mensagemErro);
      } finally {
        if (!controller.signal.aborted && versao === numero.current) setCarregando(false);
      }
    };
    const timer = setTimeout(
      () => {
        void executar();
      },
      pedido.pagina === 0 ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // O snapshot inicial é apenas a primeira página; refresh de título não reinicia uma busca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido, dono]);
  function pesquisar(valor: string) {
    setBusca(valor);
    setErro('');
    setResultado(null);
    const termo = valor.trim();
    setCarregando(Boolean(termo));
    setPedido({ termo, pagina: 0, versao: 0 });
  }
  return {
    busca,
    pesquisar,
    dados: resultado ?? inicial,
    carregando,
    erro,
    carregandoBusca: carregando && pedido.pagina === 0,
    repetir: () => {
      setErro('');
      setCarregando(true);
      setPedido((p) => ({ ...p, versao: p.versao + 1 }));
    },
    mais: () => {
      if (carregando) return;
      setErro('');
      setCarregando(true);
      setPedido((p) => ({ ...p, pagina: p.pagina + 1 }));
    },
  };
}

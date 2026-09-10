'use client';
import { useEffect, useState } from 'react';
import type { PaginaSalvas } from '@/lib/consultor/salvas-contrato';

export function useRespostasSalvas(dono: string) {
  const [busca, setBusca] = useState('');
  const [pedido, setPedido] = useState({ pagina: 0, versao: 0 });
  const [resultado, setResultado] = useState<PaginaSalvas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let cancelado = false;
    let expirou = false;
    const timeout = window.setTimeout(() => {
      expirou = true;
      controller.abort();
    }, 15_000);
    const executar = async () => {
      let falha = 'Não foi possível carregar as respostas salvas. Tente novamente.';
      try {
        const query = new URLSearchParams({
          dono,
          busca: busca.trim(),
          pagina: String(pedido.pagina),
        });
        const resposta = await fetch(`/api/consultor/salvas?${query}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!resposta.ok) {
          if (resposta.status === 401) falha = 'Entre novamente na mesma conta.';
          throw new Error(falha);
        }
        const dados = (await resposta.json()) as PaginaSalvas;
        if (controller.signal.aborted) return;
        setResultado((anterior) => ({
          ...dados,
          respostas:
            pedido.pagina > 0
              ? [
                  ...new Map(
                    [...(anterior?.respostas ?? []), ...dados.respostas].map((r) => [r.id, r]),
                  ).values(),
                ]
              : dados.respostas,
        }));
      } catch {
        if (!cancelado && (!controller.signal.aborted || expirou)) {
          setErro(falha);
          if (falha === 'Entre novamente na mesma conta.') setResultado(null);
        }
      } finally {
        clearTimeout(timeout);
        if (!cancelado && (!controller.signal.aborted || expirou)) setCarregando(false);
      }
    };
    const timer = window.setTimeout(
      () => {
        void executar();
      },
      busca ? 250 : 0,
    );
    return () => {
      cancelado = true;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [dono, busca, pedido]);
  return {
    busca,
    resultado,
    carregando,
    erro,
    pesquisar: (valor: string) => {
      setBusca(valor);
      setResultado(null);
      setErro('');
      setCarregando(true);
      setPedido({ pagina: 0, versao: 0 });
    },
    atualizar: () => {
      setResultado(null);
      setErro('');
      setCarregando(true);
      setPedido((p) => ({ pagina: 0, versao: p.versao + 1 }));
    },
    repetir: () => {
      setErro('');
      setCarregando(true);
      setPedido((p) => ({ ...p, versao: p.versao + 1 }));
    },
    mais: () => {
      if (carregando || erro || !resultado?.mais) return;
      setCarregando(true);
      setPedido((p) => ({ ...p, pagina: p.pagina + 1 }));
    },
  };
}

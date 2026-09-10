'use client';
import { useEffect, useState } from 'react';
import type { PaginaBuscaMensagens } from '@/lib/consultor/busca-mensagens-contrato';

export function useBuscaMensagens(conversa: string, dono: string, ativo: boolean) {
  const [busca, setBusca] = useState('');
  const [pedido, setPedido] = useState({ pagina: 0, versao: 0 });
  const [resultado, setResultado] = useState<PaginaBuscaMensagens | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!ativo || busca.trim().length < 2) return;
    const controller = new AbortController();
    let cancelado = false;
    let expirou = false;
    const timeout = window.setTimeout(() => {
      expirou = true;
      controller.abort();
    }, 15_000);
    const executar = async () => {
      let falha = 'Não foi possível buscar as mensagens. Tente novamente.';
      try {
        const query = new URLSearchParams({
          conversa,
          dono,
          busca: busca.trim(),
          pagina: String(pedido.pagina),
        });
        const resposta = await fetch(`/api/consultor/mensagens/busca?${query}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!resposta.ok) {
          if (resposta.status === 401) falha = 'Entre novamente na mesma conta.';
          throw new Error(falha);
        }
        const dados = (await resposta.json()) as PaginaBuscaMensagens;
        if (controller.signal.aborted) return;
        setResultado((anterior) => ({
          ...dados,
          mensagens:
            pedido.pagina > 0
              ? [
                  ...new Map(
                    [...(anterior?.mensagens ?? []), ...dados.mensagens].map((m) => [m.id, m]),
                  ).values(),
                ]
              : dados.mensagens,
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
    const timer = window.setTimeout(() => {
      void executar();
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [conversa, dono, ativo, busca, pedido]);
  return {
    busca,
    resultado,
    carregando,
    erro,
    pesquisar(valor: string) {
      setBusca(valor);
      setResultado(null);
      setErro('');
      setCarregando(valor.trim().length >= 2);
      setPedido({ pagina: 0, versao: 0 });
    },
    reabrir() {
      setResultado(null);
      setErro('');
      setCarregando(busca.trim().length >= 2);
      setPedido({ pagina: 0, versao: 0 });
    },
    repetir() {
      setErro('');
      setCarregando(true);
      setPedido((p) => ({ ...p, versao: p.versao + 1 }));
    },
    mais() {
      if (carregando || erro || !resultado?.mais) return;
      setCarregando(true);
      setPedido((p) => ({ ...p, pagina: p.pagina + 1 }));
    },
  };
}

'use client';
import { useEffect, useState } from 'react';
import type { PaginaArquivosConversa } from '@/lib/consultor/arquivos-conversa-contrato';

/** A busca só existe enquanto a lista está aberta. Nenhum arquivo é baixado aqui. */
export function useArquivosConversa(conversa: string, dono: string, ativo: boolean) {
  const [busca, setBusca] = useState('');
  const [pedido, setPedido] = useState({ pagina: 0, versao: 0 });
  const [resultado, setResultado] = useState<PaginaArquivosConversa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!ativo) return;
    const controller = new AbortController();
    let expirou = false;
    let cancelado = false;
    const timeout = window.setTimeout(() => {
      expirou = true;
      controller.abort();
    }, 15_000);
    const executar = async () => {
      setCarregando(true);
      setErro('');
      let mensagem = 'Não foi possível buscar os arquivos. Tente novamente.';
      try {
        const query = new URLSearchParams({
          conversa,
          dono,
          busca: busca.trim(),
          pagina: String(pedido.pagina),
        });
        const resposta = await fetch(`/api/consultor/arquivos?${query}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!resposta.ok) {
          if (resposta.status === 401) mensagem = 'Entre novamente na mesma conta.';
          throw new Error(mensagem);
        }
        const dados = (await resposta.json()) as PaginaArquivosConversa;
        if (controller.signal.aborted) return;
        setResultado((anterior) => ({
          ...dados,
          arquivos:
            pedido.pagina > 0
              ? [
                  ...new Map(
                    [...(anterior?.arquivos ?? []), ...dados.arquivos].map((a) => [a.id, a]),
                  ).values(),
                ]
              : dados.arquivos,
        }));
      } catch {
        if (!cancelado && (!controller.signal.aborted || expirou)) {
          setErro(mensagem);
          // Uma mudança de sessão não pode deixar os nomes anteriores à vista.
          if (mensagem === 'Entre novamente na mesma conta.') setResultado(null);
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
  }, [conversa, dono, busca, pedido, ativo]);

  return {
    busca,
    resultado,
    carregando,
    erro,
    pesquisar(valor: string) {
      setBusca(valor);
      setResultado(null);
      setErro('');
      setCarregando(true);
      setPedido({ pagina: 0, versao: 0 });
    },
    reabrir() {
      setResultado(null);
      setCarregando(true);
      setErro('');
      setPedido({ pagina: 0, versao: 0 });
    },
    repetir() {
      setCarregando(true);
      setErro('');
      setPedido((p) => ({ ...p, versao: p.versao + 1 }));
    },
    mais() {
      if (carregando || erro || !resultado?.mais) return;
      setCarregando(true);
      setPedido((p) => ({ ...p, pagina: p.pagina + 1 }));
    },
  };
}

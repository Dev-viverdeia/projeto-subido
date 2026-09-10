'use client';

import { useRef, useState } from 'react';
import { Check, Clock3 } from 'lucide-react';
import { AjudaNaFalha } from '@/components/suporte/AjudaNaFalha';
import {
  conferirEnriquecimento,
  type ReciboEnriquecimento,
} from '@/lib/crm/invocar-enriquecimento';

export function RecuperarEnriquecimento({
  oportunidadeId,
  anteriorId,
  aoAbrirFicha,
}: {
  oportunidadeId: string;
  anteriorId: string | null | undefined;
  aoAbrirFicha: () => void;
}) {
  const ocupado = useRef(false);
  const [consultando, setConsultando] = useState(false);
  const [recibo, setRecibo] = useState<ReciboEnriquecimento | null>(null);
  const [mensagem, setMensagem] = useState('Consultar não inicia outra análise nem usa créditos.');

  async function conferir() {
    if (ocupado.current) return;
    ocupado.current = true;
    setConsultando(true);
    try {
      const atual = await conferirEnriquecimento(oportunidadeId);
      // Um resultado anterior nunca é apresentado como confirmação do pedido perdido.
      if (atual && anteriorId !== undefined && atual.id !== anteriorId) {
        setRecibo(atual);
      } else {
        setMensagem(
          'Ainda não encontramos a confirmação desta análise. Confira novamente em instantes ou peça ajuda.',
        );
      }
    } catch {
      setMensagem('Não foi possível consultar agora. Reconecte e confira novamente.');
    } finally {
      ocupado.current = false;
      setConsultando(false);
    }
  }
  const pronta = recibo?.status === 'concluido';
  return (
    <AjudaNaFalha
      contexto="enriquecimento"
      pagina={`/vendas/${oportunidadeId}`}
      aviso={recibo ? 'status' : 'alert'}
      icone={
        pronta ? (
          <Check size={21} aria-hidden="true" />
        ) : recibo && recibo.status !== 'falhou' ? (
          <Clock3 size={21} aria-hidden="true" />
        ) : undefined
      }
      titulo={
        pronta
          ? 'A análise está pronta'
          : recibo?.status === 'falhou'
            ? 'A análise foi encerrada'
            : recibo
              ? 'A análise está em andamento'
              : 'Confirmação pendente'
      }
      descricao={recibo ? 'Abra a ficha para ver o resultado e o estado da análise.' : mensagem}
      acao={
        <button
          type="button"
          disabled={consultando}
          onClick={recibo ? aoAbrirFicha : () => void conferir()}
        >
          {consultando
            ? 'Conferindo análise…'
            : pronta
              ? 'Ver resultado'
              : recibo
                ? 'Abrir ficha'
                : 'Conferir andamento'}
        </button>
      }
    />
  );
}

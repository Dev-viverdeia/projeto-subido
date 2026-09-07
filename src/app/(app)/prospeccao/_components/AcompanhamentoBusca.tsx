'use client';

import { useState } from 'react';
import { useAcompanhamentoOperacao } from '../../_components/useAcompanhamentoOperacao';
import { ProgressoBusca } from './ProgressoBusca';
import { ResultadoBusca } from './ResultadoBusca';

export function AcompanhamentoBusca({
  status,
  quantidade,
  etapa,
  detalhe,
  segmento,
  localizacao,
  encontradas,
  minimizadoInicial = false,
}: {
  status: string;
  quantidade: number;
  etapa: number;
  detalhe: string | null;
  segmento: string;
  localizacao: string;
  encontradas: number;
  minimizadoInicial?: boolean;
}) {
  const [mostrarResultado, setMostrarResultado] = useState(
    status === 'processando' || !minimizadoInicial,
  );
  const online = useAcompanhamentoOperacao(status === 'processando');

  if (status === 'concluida' || status === 'falhou') {
    if (!mostrarResultado) return null;
    return (
      <ResultadoBusca
        estado={status}
        segmento={segmento}
        localizacao={localizacao}
        solicitadas={quantidade}
        encontradas={encontradas}
        onClose={() => setMostrarResultado(false)}
      />
    );
  }
  if (status !== 'processando') return null;
  return (
    <ProgressoBusca
      quantidade={quantidade}
      etapa={etapa}
      detalhe={detalhe}
      online={online}
      minimizadoInicial={minimizadoInicial}
    />
  );
}

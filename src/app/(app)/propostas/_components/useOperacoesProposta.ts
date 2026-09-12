'use client';

import { useActionState } from 'react';
import { mudarStatusProposta, salvarProposta, type EstadoProposta } from '@/lib/propostas/actions';
import type { useAcompanhamentoProposta } from './useAcompanhamentoProposta';

const INICIAL: EstadoProposta = {};

export function useOperacoesProposta(
  acompanhamento: Pick<
    ReturnType<typeof useAcompanhamentoProposta>,
    'iniciarAlteracao' | 'concluirAlteracao'
  >,
  confirmarConteudo: (conteudo: string) => void,
) {
  const [estadoSalvar, acaoSalvar, salvando] = useActionState(
    async (estado: EstadoProposta, dados: FormData) => {
      acompanhamento.iniciarAlteracao();
      let resultado: EstadoProposta | undefined;
      try {
        resultado = await salvarProposta(estado, dados);
        // Confirma só o conteúdo enviado, nunca o digitado durante a espera.
        if (resultado.sucesso) {
          confirmarConteudo(JSON.stringify([dados.get('titulo'), dados.get('documento')]));
        }
        return resultado;
      } finally {
        acompanhamento.concluirAlteracao(resultado);
      }
    },
    INICIAL,
  );
  const [estadoStatus, acaoStatus, atualizandoStatus] = useActionState(
    async (estado: EstadoProposta, dados: FormData) => {
      acompanhamento.iniciarAlteracao();
      let resultado: EstadoProposta | undefined;
      try {
        resultado = await mudarStatusProposta(estado, dados);
        return resultado;
      } finally {
        acompanhamento.concluirAlteracao(resultado);
      }
    },
    INICIAL,
  );
  return { estadoSalvar, acaoSalvar, salvando, estadoStatus, acaoStatus, atualizandoStatus };
}

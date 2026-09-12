'use client';

import { useActionState } from 'react';
import { mudarStatusProposta, salvarProposta, type EstadoProposta } from '@/lib/propostas/actions';
import type { useAcompanhamentoProposta } from './useAcompanhamentoProposta';
import type { useEdicaoSegura } from './useEdicaoSegura';

const INICIAL: EstadoProposta = {};

export function useOperacoesProposta(
  acompanhamento: Pick<
    ReturnType<typeof useAcompanhamentoProposta>,
    'iniciarAlteracao' | 'concluirAlteracao'
  >,
  confirmarConteudo: (conteudo: string) => void,
  edicao: Pick<ReturnType<typeof useEdicaoSegura>, 'iniciar' | 'concluir'>,
) {
  const [estadoSalvar, acaoSalvar, salvando] = useActionState(
    async (estado: EstadoProposta, dados: FormData) => {
      acompanhamento.iniciarAlteracao();
      edicao.iniciar();
      let resultado: EstadoProposta | undefined;
      try {
        resultado = await salvarProposta(estado, dados);
        // Confirma só o conteúdo enviado, nunca o digitado durante a espera.
        if (resultado.sucesso) {
          confirmarConteudo(JSON.stringify([dados.get('titulo'), dados.get('documento')]));
        }
        return resultado;
      } catch {
        resultado = { erro: 'Não foi possível confirmar o salvamento. Sua edição continua aqui.' };
        return resultado;
      } finally {
        edicao.concluir(resultado);
        acompanhamento.concluirAlteracao(resultado);
      }
    },
    INICIAL,
  );
  const [estadoStatus, acaoStatus, atualizandoStatus] = useActionState(
    async (estado: EstadoProposta, dados: FormData) => {
      acompanhamento.iniciarAlteracao();
      edicao.iniciar();
      let resultado: EstadoProposta | undefined;
      try {
        resultado = await mudarStatusProposta(estado, dados);
        return resultado;
      } finally {
        edicao.concluir(resultado);
        acompanhamento.concluirAlteracao(resultado);
      }
    },
    INICIAL,
  );
  return { estadoSalvar, acaoSalvar, salvando, estadoStatus, acaoStatus, atualizandoStatus };
}

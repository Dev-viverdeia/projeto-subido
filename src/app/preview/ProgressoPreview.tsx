'use client';

import type { ReactNode } from 'react';
import { ContextoProgresso, type ValorContextoProgresso } from '@/lib/progresso/local';

const instante = '2026-09-05T12:00:00.000Z';
const semMutacao = () => undefined;

/** Estados visuais determinísticos, sem ler nem alterar o progresso de uma conta. */
export function ProgressoPreview({
  aulas = [],
  etapas = [],
  sincronizacao = 'salvo',
  children,
}: {
  aulas?: string[];
  etapas?: string[];
  sincronizacao?: ValorContextoProgresso['sincronizacao'];
  children: ReactNode;
}) {
  return (
    <ContextoProgresso.Provider
      value={{
        sincronizacao,
        estado: {
          aulas: Object.fromEntries(aulas.map((id) => [id, instante])),
          etapas: Object.fromEntries(etapas.map((id) => [id, instante])),
          formacoes: {},
          solucoes: {},
        },
        acoes: {
          concluirAula: semMutacao,
          tocarFormacao: semMutacao,
          alternarEtapa: semMutacao,
        },
      }}
    >
      {children}
    </ContextoProgresso.Provider>
  );
}

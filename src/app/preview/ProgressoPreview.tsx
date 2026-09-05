'use client';

import type { ReactNode } from 'react';
import { ContextoProgresso } from '@/lib/progresso/local';

const instante = '2026-09-05T12:00:00.000Z';
const semMutacao = () => undefined;

/** Estados visuais determinísticos, sem ler nem alterar o progresso de uma conta. */
export function ProgressoPreview({
  aulas = [],
  etapas = [],
  children,
}: {
  aulas?: string[];
  etapas?: string[];
  children: ReactNode;
}) {
  return (
    <ContextoProgresso.Provider
      value={{
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

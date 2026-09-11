'use client';

import { useRef, useState } from 'react';
import type { EstadoStack, EstadoTarefa } from '@/lib/builder/queries';
import { SalaDoProjeto } from '@/app/(app)/builder/_components/sala/SalaDoProjeto';
import { Kanban } from '@/app/(app)/builder/_components/sala/Kanban';
import { EtapaKit } from '@/app/(app)/builder/_components/sala/EtapaKit';
import { projetoEstudioPreview } from './fixture';

export function EstudioPreview({
  estado,
  entender,
}: {
  estado?: string;
  entender: React.ReactNode;
}) {
  const documento = projetoEstudioPreview.documento!;
  const [tarefas, setTarefas] = useState<Record<number, EstadoTarefa>>(
    estado === 'concluido'
      ? Object.fromEntries(documento.etapas.map((_, i) => [i, 'feito']))
      : projetoEstudioPreview.tarefas,
  );
  const [stack, setStack] = useState<EstadoStack>(
    estado === 'preparar' || !estado ? null : 'lovable_supabase',
  );
  const falhou = useRef(false);
  const solucao = { ...projetoEstudioPreview, tarefas, stack };
  const aguardar = () => new Promise<void>((resolve) => setTimeout(resolve, 300));
  return (
    <SalaDoProjeto
      solucao={solucao}
      criacao={
        <div>
          <h2>Plano preparado</h2>
          <p>O escopo está pronto para revisão.</p>
        </div>
      }
      entender={entender}
      kit={
        <EtapaKit
          id={solucao.id}
          documento={documento}
          stack={stack}
          salvar={async (dados) => {
            await aguardar();
            setStack(dados.get('stack') as EstadoStack);
            return { ok: true };
          }}
        />
      }
      construir={
        <Kanban
          id={solucao.id}
          etapas={documento.etapas}
          tarefas={tarefas}
          salvar={async (dados) => {
            await aguardar();
            if (estado === 'erro' && !falhou.current) {
              falhou.current = true;
              throw new Error('Falha simulada');
            }
            setTarefas((anterior) => ({
              ...anterior,
              [Number(dados.get('indice'))]: dados.get('estado') as EstadoTarefa,
            }));
            return { ok: true };
          }}
        />
      }
    />
  );
}

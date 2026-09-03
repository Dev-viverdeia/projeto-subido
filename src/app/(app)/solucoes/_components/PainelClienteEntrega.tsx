'use client';

import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { BriefingKickoff } from './BriefingKickoff';
import { ContextoEntrega } from './ContextoEntrega';
import { InicioProjeto } from './InicioProjeto';
import { PreparacaoProjeto } from './PreparacaoProjeto';

export function PainelClienteEntrega({
  projeto,
  primeiraTarefa,
  onComecar,
}: {
  projeto: ProjetoExecucaoCompleto;
  primeiraTarefa: string | null;
  onComecar: () => void;
}) {
  const briefingConfirmado = Boolean(projeto.briefing.confirmadoEm);

  return (
    <>
      {projeto.feitas === 0 && projeto.status !== 'concluido' && (
        <InicioProjeto
          projeto={projeto}
          briefingConfirmado={briefingConfirmado}
          primeiraTarefa={primeiraTarefa}
          onComecar={onComecar}
        />
      )}

      {(projeto.kickoff || briefingConfirmado) && (
        <BriefingKickoff
          projetoId={projeto.id}
          briefing={projeto.briefing}
          origem={projeto.briefingOrigem}
        />
      )}

      {briefingConfirmado && projeto.feitas > 0 && (
        <PreparacaoProjeto
          projetoId={projeto.id}
          acoes={projeto.acoesPlano}
          portalAtivo={projeto.portalAtivo}
          portalCodigo={projeto.portalCodigo}
        />
      )}

      {projeto.feitas > 0 && (
        <ContextoEntrega projeto={projeto} briefingConfirmado={briefingConfirmado} />
      )}
    </>
  );
}

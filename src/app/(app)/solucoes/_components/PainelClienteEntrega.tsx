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
  trabalhoIniciado,
}: {
  projeto: ProjetoExecucaoCompleto;
  primeiraTarefa: string | null;
  onComecar: () => void;
  trabalhoIniciado: boolean;
}) {
  const briefingConfirmado = Boolean(projeto.briefing.confirmadoEm);

  return (
    <>
      {!trabalhoIniciado && projeto.status !== 'concluido' && (
        <InicioProjeto
          projeto={projeto}
          briefingConfirmado={briefingConfirmado}
          primeiraTarefa={primeiraTarefa}
          onComecar={onComecar}
        />
      )}

      {(projeto.kickoff || briefingConfirmado || trabalhoIniciado) && (
        <BriefingKickoff
          projetoId={projeto.id}
          briefing={projeto.briefing}
          origem={projeto.briefingOrigem}
        />
      )}

      {briefingConfirmado && trabalhoIniciado && (
        <PreparacaoProjeto
          projetoId={projeto.id}
          acoes={projeto.acoesPlano}
          portalAtivo={projeto.portalAtivo}
          portalCodigo={projeto.portalCodigo}
        />
      )}

      {trabalhoIniciado && (
        <ContextoEntrega projeto={projeto} briefingConfirmado={briefingConfirmado} />
      )}
    </>
  );
}

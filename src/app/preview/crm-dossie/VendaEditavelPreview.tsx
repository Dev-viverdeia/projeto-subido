'use client';

import { useRef, useState } from 'react';
import type { DossieLead } from '@/lib/crm/dossie-types';
import { CabecalhoDossie } from '@/app/(app)/crm/[id]/_components/CabecalhoDossie';
import { EditarVenda } from '@/app/(app)/crm/[id]/_components/EditarVenda';
import { CartaoOportunidade } from '@/app/(app)/crm/_components/KanbanCartao';
import { DndContext } from '@dnd-kit/core';
import { valorPrevistoCampo, valorPrevistoCentavos } from '@/lib/crm/venda-schema';

/** Preview isolado, inacessível em produção. Não chama banco nem provedores. */
export function VendaEditavelPreview({
  lead: base,
  cenario,
}: {
  lead: DossieLead;
  cenario: string;
}) {
  const [lead, setLead] = useState(base);
  const [revisao, setRevisao] = useState(0);
  const tentativas = useRef(0);
  return (
    <>
      <CabecalhoDossie
        lead={lead}
        enriquecimentoEmAndamento={false}
        temDossie
        edicaoVenda={
          <EditarVenda
            inicial={{
              oportunidade: lead.oportunidade.id,
              revisao,
              titulo: lead.oportunidade.titulo,
              valor: valorPrevistoCampo(lead.oportunidade.valorCentavos),
            }}
            salvar={async (entrada) => {
              await new Promise((resolve) => setTimeout(resolve, 1200));
              tentativas.current += 1;
              if (cenario === 'erro' && tentativas.current === 1)
                return { ok: false, erro: 'Não foi possível salvar. Tente novamente.' };
              if (cenario === 'conflito')
                return {
                  ok: false,
                  conflito: true,
                  erro: 'Esta venda mudou em outra edição. Cancele e reabra para conferir os dados atuais.',
                };
              setLead({
                ...lead,
                oportunidade: {
                  ...lead.oportunidade,
                  titulo: entrada.titulo,
                  valorCentavos: valorPrevistoCentavos(entrada.valor) ?? null,
                },
              });
              setRevisao((atual) => atual + 1);
              return { ok: true };
            }}
          />
        }
      />
      <section aria-label="Prévia do card no kanban">
        <DndContext id="preview-editar-venda">
          <CartaoOportunidade
            oportunidade={lead.oportunidade}
            aoMover={() => {}}
            desabilitado={false}
          />
        </DndContext>
      </section>
    </>
  );
}

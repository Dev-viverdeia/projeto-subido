'use client';

import { useRef, useState } from 'react';
import type { DossieLead } from '@/lib/crm/dossie-types';
import { CabecalhoDossie } from '@/app/(app)/crm/[id]/_components/CabecalhoDossie';
import { EditarEmpresa } from '@/app/(app)/crm/[id]/_components/EditarEmpresa';

/** Somente na rota de preview bloqueada em produção; nunca grava dados reais. */
export function EmpresaEditavelPreview({
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
    <CabecalhoDossie
      lead={lead}
      enriquecimentoEmAndamento={false}
      temDossie
      edicaoEmpresa={
        <EditarEmpresa
          inicial={{
            oportunidade: lead.oportunidade.id,
            empresaId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            revisao,
            nome: lead.empresa.nome,
            site: lead.empresa.dominio ?? '',
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
                erro: 'Esta empresa mudou em outra edição. Cancele e reabra para conferir os dados atuais.',
              };
            setLead({
              ...lead,
              empresa: { ...lead.empresa, nome: entrada.nome, dominio: entrada.site || null },
            });
            setRevisao((atual) => atual + 1);
            return { ok: true };
          }}
        />
      }
    />
  );
}

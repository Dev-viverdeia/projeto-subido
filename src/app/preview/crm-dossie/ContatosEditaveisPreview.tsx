'use client';

import { useRef, useState } from 'react';
import type { DossieLead } from '@/lib/crm/dossie-types';
import { EditarContato } from '@/app/(app)/crm/[id]/_components/EditarContato';
import { InteligenciaDeContato } from '@/app/(app)/crm/[id]/_components/InteligenciaDeContato';

/** A rota pai bloqueia produção. Esta simulação nunca chama uma ação de gravação. */
export function ContatosEditaveisPreview({
  lead: base,
  cenario,
}: {
  lead: DossieLead;
  cenario: string;
}) {
  const [lead, setLead] = useState(base);
  const tentativas = useRef(0);
  const [revisao, setRevisao] = useState(0);
  return (
    <InteligenciaDeContato
      lead={{ ...lead, contatos: undefined }}
      edicao={
        <EditarContato
          inicial={{
            oportunidade: lead.oportunidade.id,
            contatoId: lead.contato ? 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' : null,
            revisao: lead.contato ? revisao : null,
            nome: lead.contato?.nome ?? '',
            telefone: lead.contato?.telefone ?? '',
            email: lead.contato?.email ?? '',
          }}
          salvar={async (entrada) => {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            tentativas.current += 1;
            if (cenario === 'erro' && tentativas.current === 1)
              return { ok: false, erro: 'Não foi possível salvar. Tente novamente.' };
            if (cenario === 'conflito' && tentativas.current === 1)
              return {
                ok: false,
                conflito: true,
                erro: 'Este contato mudou em outra edição. Cancele e reabra para conferir os dados atuais.',
              };
            setLead({
              ...lead,
              contato: {
                ...lead.contato,
                nome: entrada.nome || 'Contato a identificar',
                telefone: entrada.telefone || null,
                email: entrada.email || null,
                cargo: lead.contato?.cargo ?? null,
                linkedinUrl: lead.contato?.linkedinUrl ?? null,
                telefoneManual: true,
              },
            });
            setRevisao((atual) => atual + 1);
            return { ok: true };
          }}
        />
      }
    />
  );
}

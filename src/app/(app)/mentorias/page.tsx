import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { EmptyState } from '@/design-system/via';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';

export const metadata: Metadata = { title: 'Mentorias' };

/** Pilar 04. Encontros em grupo semanais + sessões individuais por crédito. */
export default function MentoriasPage() {
  return (
    <>
      <CabecalhoPagina
        titulo="Mentorias"
        descricao="Encontros em grupo toda semana e sessões individuais por crédito. Você chega com o problema real e sai com o próximo passo."
      />

      <EmptyState
        icon={<Users size={20} strokeWidth={1.8} />}
        title="Nenhum encontro agendado"
        description="A agenda, os créditos e as gravações aparecem aqui quando o calendário estiver conectado."
      />
    </>
  );
}

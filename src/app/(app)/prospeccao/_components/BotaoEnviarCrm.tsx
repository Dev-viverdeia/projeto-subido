'use client';

import Link from 'next/link';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/design-system/via';
import { enviarLeadAoCrm } from '@/lib/prospeccao/actions';

function BotaoPendente({ compacto = false }: { compacto?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size={compacto ? 'sm' : 'md'}
      variant="primary"
      loading={pending}
      iconLeft={!pending ? <Plus size={15} aria-hidden="true" /> : undefined}
    >
      {pending ? 'Criando oportunidade' : 'Criar oportunidade'}
    </Button>
  );
}

export function BotaoEnviarCrm({
  lead,
  oportunidade = null,
  compacto = false,
  className,
}: {
  lead?: string;
  oportunidade?: string | null;
  compacto?: boolean;
  className?: string;
} = {}) {
  // Compatibilidade com formulários já existentes: sem `lead`, o componente é
  // somente o botão submit e o campo oculto continua no formulário pai.
  if (!lead) return <BotaoPendente compacto={compacto} />;

  if (oportunidade) {
    return (
      <Link className={className} href={`/vendas/${oportunidade}`}>
        <Check size={15} aria-hidden="true" /> Abrir ficha{' '}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <form action={enviarLeadAoCrm} className={className}>
      <input type="hidden" name="lead" value={lead} />
      <BotaoPendente compacto={compacto} />
    </form>
  );
}

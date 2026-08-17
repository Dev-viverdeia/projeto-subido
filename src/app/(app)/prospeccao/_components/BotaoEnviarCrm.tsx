'use client';

import { useFormStatus } from 'react-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/design-system/via';

/** Mantém a transição para o CRM explícita dentro do próprio CTA. */
export function BotaoEnviarCrm() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="primary"
      loading={pending}
      iconRight={!pending ? <ArrowRight size={16} /> : undefined}
    >
      {pending ? 'Criando oportunidade…' : 'Enviar para o CRM'}
    </Button>
  );
}

'use client';

import { useFormStatus } from 'react-dom';
import { RotateCcw } from 'lucide-react';
import { iniciarNovoCicloCliente } from '@/lib/crm/actions';
import styles from './ResumoOperacionalLead.module.css';

function Botao() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.acaoPrimaria} disabled={pending}>
      <RotateCcw size={15} strokeWidth={1.9} aria-hidden="true" />
      {pending ? 'Abrindo ciclo' : 'Abrir novo ciclo'}
    </button>
  );
}

export function BotaoNovoCiclo({ oportunidadeId }: { oportunidadeId: string }) {
  return (
    <form action={iniciarNovoCicloCliente} className={styles.novoCicloForm}>
      <input type="hidden" name="oportunidade" value={oportunidadeId} />
      <Botao />
    </form>
  );
}

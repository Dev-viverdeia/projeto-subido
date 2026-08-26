'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/design-system/via';
import type { ComponentProps } from 'react';
import styles from './formulario.module.css';

/**
 * Botão de submit com estado de envio.
 *
 * `useFormStatus` precisa estar num componente FILHO do `<form>` — chamado no mesmo
 * componente que renderiza o form, ele devolve `pending: false` para sempre, sem
 * erro nenhum. É a pegadinha da API, e é por isso que este botão é um arquivo
 * separado em vez de estar inline em cada formulário.
 *
 * `type="submit"` explícito porque o Button do DS renderiza `type="button"` por
 * padrão — sem isto, o formulário não envia.
 */
export function BotaoEnviar({
  children,
  variant = 'primary',
}: {
  children: string;
  variant?: ComponentProps<typeof Button>['variant'];
}) {
  const { pending } = useFormStatus();

  return (
    <div className={styles.acao}>
      <Button type="submit" variant={variant} size="lg" fullWidth loading={pending}>
        {children}
      </Button>
    </div>
  );
}

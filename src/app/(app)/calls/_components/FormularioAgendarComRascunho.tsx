'use client';
import { useEffect, useSyncExternalStore, type ComponentProps } from 'react';
import { chaveRascunhoAgenda, lerRascunhoAgenda } from '@/lib/calls/rascunho-agenda';
import { FormularioAgendarCall } from './FormularioAgendarCall';

const escutar = () => () => undefined;
const servidor = () => null;
export function FormularioAgendarComRascunho({
  rascunhoDono,
  limparRascunho,
  ...props
}: ComponentProps<typeof FormularioAgendarCall> & { limparRascunho?: boolean }) {
  const chave = rascunhoDono ? chaveRascunhoAgenda(rascunhoDono) : null;
  const salvo = useSyncExternalStore(
    escutar,
    () => {
      if (!chave || !props.abertoInicial || limparRascunho) return null;
      try {
        return sessionStorage.getItem(chave);
      } catch {
        return null;
      }
    },
    servidor,
  );
  useEffect(() => {
    if (!limparRascunho || !chave) return;
    try {
      sessionStorage.removeItem(chave);
    } catch {
      /* Armazenamento indisponível. */
    }
  }, [limparRascunho, chave]);
  return (
    <FormularioAgendarCall
      {...props}
      key={salvo ?? 'novo'}
      rascunhoDono={rascunhoDono}
      rascunho={lerRascunhoAgenda(salvo) ?? undefined}
    />
  );
}

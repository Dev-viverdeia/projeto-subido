'use client';

import { useSyncExternalStore } from 'react';

const escutar = () => () => undefined;
const cliente = () => true;
const servidor = () => false;

export function CamposFusoAgenda({ quando }: { quando: string }) {
  const montado = useSyncExternalStore(escutar, cliente, servidor);
  const offset = montado
    ? (Number.isFinite(Date.parse(quando)) ? new Date(quando) : new Date()).getTimezoneOffset()
    : 0;
  return (
    <>
      <input type="hidden" name="offsetMinutos" value={offset} />
      <input
        type="hidden"
        name="fusoHorario"
        value={montado ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''}
      />
    </>
  );
}

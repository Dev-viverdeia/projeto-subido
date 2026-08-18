'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopiarContato({ valor, className }: { valor: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <button
      type="button"
      className={className}
      aria-label={copiado ? 'Contato copiado' : `Copiar ${valor}`}
      title={copiado ? 'Copiado' : 'Copiar'}
      onClick={() => {
        void navigator.clipboard.writeText(valor).then(() => {
          setCopiado(true);
          window.setTimeout(() => setCopiado(false), 1800);
        });
      }}
    >
      {copiado ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
    </button>
  );
}

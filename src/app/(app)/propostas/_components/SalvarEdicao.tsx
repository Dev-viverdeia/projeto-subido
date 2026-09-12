'use client';

import { Check, Save } from 'lucide-react';
import { Spinner } from '@/design-system/via';
import styles from './EditorProposta.module.css';

export function SalvarEdicao({
  id,
  versao,
  titulo,
  documento,
  acao,
  salvando,
  sujo,
  bloqueado,
  mobile = false,
}: {
  id: string;
  versao: number;
  titulo: string;
  documento: string;
  acao: (dados: FormData) => void;
  salvando: boolean;
  sujo: boolean;
  bloqueado: boolean;
  mobile?: boolean;
}) {
  return (
    <form action={acao} className={mobile ? styles.salvarMobile : undefined}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="versao" value={versao} />
      <input type="hidden" name="titulo" value={titulo} />
      <input type="hidden" name="documento" value={documento} />
      <button
        type="submit"
        className={mobile ? undefined : styles.salvar}
        disabled={salvando || !sujo || bloqueado}
      >
        {salvando ? (
          <span aria-hidden="true">
            <Spinner size="sm" tone="inverse" />
          </span>
        ) : !sujo ? (
          <Check size={15} aria-hidden="true" />
        ) : (
          <Save size={15} aria-hidden="true" />
        )}
        {salvando ? 'Salvando' : sujo ? (mobile ? 'Salvar' : 'Salvar alterações') : 'Salvo'}
      </button>
    </form>
  );
}

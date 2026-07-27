'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '@/design-system/via';
import styles from './excluir.module.css';

function Confirmar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" loading={pending}>
      {rotulo}
    </Button>
  );
}

/**
 * Exclusão em dois toques.
 *
 * O primeiro clique só troca o botão pela confirmação; o segundo é que envia. Sem
 * isso, um clique errado apaga a solução e, por cascade, todas as etapas,
 * ferramentas e prompts dela — e não há desfazer.
 *
 * `window.confirm` faria o mesmo trabalho em uma linha, mas é bloqueante, não
 * segue o design do sistema, e em alguns browsers pode ser suprimido pelo usuário
 * — quando isso acontece, ele retorna `false` e a exclusão simplesmente nunca
 * ocorre, o que é confuso de diagnosticar.
 */
export function BotaoExcluir({
  id,
  acao,
  descricao,
}: {
  id: string;
  acao: (formData: FormData) => Promise<void>;
  descricao: string;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconLeft={<Trash2 size={15} strokeWidth={1.8} />}
        onClick={() => setConfirmando(true)}
      >
        Excluir
      </Button>
    );
  }

  return (
    <div className={styles.confirmacao} role="alertdialog" aria-label="Confirmar exclusão">
      <p className={styles.aviso}>{descricao}</p>
      <form action={acao} className={styles.botoes}>
        <input type="hidden" name="id" value={id} />
        <Confirmar rotulo="Excluir mesmo assim" />
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
      </form>
    </div>
  );
}

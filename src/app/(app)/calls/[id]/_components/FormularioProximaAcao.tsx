'use client';

import { useFormStatus } from 'react-dom';
import { Check } from 'lucide-react';
import { confirmarProximaAcao } from '@/lib/calls/actions';
import styles from '../pagina.module.css';

function BotaoConfirmar() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined}>
      {pending ? 'Salvando no CRM…' : 'Confirmar próximo passo'}
      <Check size={16} aria-hidden="true" />
    </button>
  );
}

export function FormularioProximaAcao({
  reuniaoId,
  oportunidadeId,
  acaoInicial,
  dataInicial,
}: {
  reuniaoId: string;
  oportunidadeId: string;
  acaoInicial: string;
  dataInicial: string;
}) {
  return (
    <form action={confirmarProximaAcao} className={styles.formularioAcao}>
      <input type="hidden" name="reuniao" value={reuniaoId} />
      <input type="hidden" name="oportunidade" value={oportunidadeId} />
      <label>
        <span>Ação combinada</span>
        <textarea
          name="acao"
          rows={3}
          maxLength={500}
          defaultValue={acaoInicial}
          placeholder="Ex.: enviar diagnóstico revisado para o contato"
          aria-describedby="proxima-acao-ajuda"
          required
        />
      </label>
      <div className={styles.acaoCampos}>
        <label>
          <span>Data combinada</span>
          <input type="date" name="quando" defaultValue={dataInicial} />
        </label>
        <BotaoConfirmar />
      </div>
      <small id="proxima-acao-ajuda" className={styles.acaoNota}>
        Entra no CRM agora e acompanha este cliente até a entrega.
      </small>
    </form>
  );
}

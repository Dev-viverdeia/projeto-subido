'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, ListChecks } from 'lucide-react';
import { Alert, Button } from '@/design-system/via';
import { aplicarProximaAcao, type ResultadoAplicarAcao } from '@/lib/crm/actions';
import styles from './PesquisaComercial.module.css';

function BotaoSalvar({ salva }: { salva: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" loading={pending} disabled={salva || pending}>
      {salva ? (
        <>
          <Check size={15} aria-hidden="true" /> Salva no pipeline
        </>
      ) : pending ? (
        'Salvando próxima ação…'
      ) : (
        <>
          <ListChecks size={15} aria-hidden="true" /> Usar como próxima ação
        </>
      )}
    </Button>
  );
}

export function BotaoProximaAcao({
  oportunidadeId,
  enriquecimentoId,
  salva,
}: {
  oportunidadeId: string;
  enriquecimentoId: string;
  salva: boolean;
}) {
  const [estado, acao] = useActionState<ResultadoAplicarAcao | null, FormData>(
    aplicarProximaAcao,
    null,
  );

  return (
    <form action={acao} className={styles.formAcao}>
      <input type="hidden" name="oportunidade" value={oportunidadeId} />
      <input type="hidden" name="enriquecimento" value={enriquecimentoId} />
      <BotaoSalvar salva={salva || estado?.ok === true} />
      {estado && !estado.ok && (
        <Alert tone="danger" size="compact">
          {estado.erro}
        </Alert>
      )}
      {estado?.ok && (
        <p className={styles.acaoSalva} role="status">
          <Check size={14} aria-hidden="true" /> {estado.mensagem}
        </p>
      )}
    </form>
  );
}

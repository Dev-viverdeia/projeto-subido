'use client';

import { useActionState } from 'react';
import { CalendarDays, Save } from 'lucide-react';
import { definirPrazoProjeto, type EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import styles from './SalaEntrega.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};

function dataParaCampo(valor: string | null): string {
  return valor ? new Date(valor).toISOString().slice(0, 10) : '';
}

export function PrazoProjeto({ projetoId, prazo }: { projetoId: string; prazo: string | null }) {
  const [estado, acao, pendente] = useActionState(definirPrazoProjeto, ESTADO_INICIAL);
  return (
    <section className={styles.prazo}>
      <p>
        <CalendarDays size={15} aria-hidden="true" /> Prazo da entrega
      </p>
      <form action={acao}>
        <input type="hidden" name="projeto" value={projetoId} />
        <input
          type="date"
          name="prazo"
          defaultValue={dataParaCampo(prazo)}
          aria-label="Prazo da entrega"
        />
        <button type="submit" disabled={pendente} aria-label="Salvar prazo">
          <Save size={15} aria-hidden="true" />
        </button>
      </form>
      {estado.erro && <small role="alert">{estado.erro}</small>}
      {estado.sucesso && <small role="status">{estado.sucesso}</small>}
    </section>
  );
}

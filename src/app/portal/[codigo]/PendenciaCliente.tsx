'use client';

import { useActionState } from 'react';
import { CalendarDays, Check, ClipboardList, KeyRound } from 'lucide-react';
import { concluirPendenciaCliente, type EstadoPortalCliente } from '@/lib/portal-cliente/actions';
import type { AcaoPortalCliente } from '@/lib/portal-cliente/servico';
import { prazoEstaAtrasado, rotuloPrazoOperacional } from '@/lib/projetos-execucao/prazo';
import styles from './portal.module.css';

const INICIAL: EstadoPortalCliente = {};
const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  timeZone: 'America/Sao_Paulo',
});

export function PendenciaCliente({ codigo, acao }: { codigo: string; acao: AcaoPortalCliente }) {
  const [estado, concluir, pendente] = useActionState(concluirPendenciaCliente, INICIAL);
  const atrasada = prazoEstaAtrasado(acao.prazoEm);

  return (
    <article className={styles.pendenciaCliente} data-atrasada={atrasada || undefined}>
      <span className={styles.pendenciaIcone}>
        {acao.categoria === 'acesso' ? <KeyRound size={18} /> : <ClipboardList size={18} />}
      </span>
      <div>
        <p>{acao.categoria === 'acesso' ? 'Acesso ou permissão' : 'Próximo passo'}</p>
        <h3>{acao.titulo}</h3>
        <span>
          <CalendarDays size={13} />
          {acao.prazoEm
            ? atrasada
              ? rotuloPrazoOperacional(acao.prazoEm)
              : `Até ${DATA.format(new Date(acao.prazoEm))}`
            : 'Prazo a combinar'}
        </span>
        {estado.erro && <small role="alert">{estado.erro}</small>}
        {estado.sucesso && <small role="status">{estado.sucesso}</small>}
      </div>
      <form action={concluir}>
        <input type="hidden" name="codigo" value={codigo} />
        <input type="hidden" name="acao" value={acao.id} />
        <button type="submit" disabled={pendente}>
          <Check size={15} /> {pendente ? 'Confirmando…' : 'Confirmar como resolvido'}
        </button>
      </form>
    </article>
  );
}

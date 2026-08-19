import Link from 'next/link';
import { BriefcaseBusiness, FileSignature } from 'lucide-react';
import type { DossieLead } from '@/lib/crm/queries';
import styles from './CabecalhoDossie.module.css';

export function AtalhoProposta({
  lead,
  destaque = true,
}: {
  lead: DossieLead;
  destaque?: boolean;
}) {
  const projeto = lead.projetoAtivo ?? lead.projetoRecente;
  const classeAcao = destaque ? styles.acaoPrimaria : styles.acaoSecundaria;

  if (projeto) {
    return (
      <>
        {lead.propostaRecente && (
          <Link href={`/propostas/${lead.propostaRecente.id}`} className={styles.acaoSecundaria}>
            <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
            Ver proposta
          </Link>
        )}
        <Link href={`/solucoes/execucao/${projeto.id}`} className={styles.acaoPrimaria}>
          <BriefcaseBusiness size={16} strokeWidth={1.8} aria-hidden="true" />
          {projeto.status === 'concluido' ? 'Ver entrega' : 'Abrir projeto'}
        </Link>
      </>
    );
  }

  if (lead.propostaRecente && lead.propostaRecente.status !== 'recusada') {
    return (
      <Link href={`/propostas/${lead.propostaRecente.id}`} className={classeAcao}>
        <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
        Ver proposta
      </Link>
    );
  }

  return (
    <Link href={`/propostas/nova?oportunidade=${lead.oportunidade.id}`} className={classeAcao}>
      <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
      {lead.propostaRecente ? 'Nova proposta' : 'Criar proposta'}
    </Link>
  );
}

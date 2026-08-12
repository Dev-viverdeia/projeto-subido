import Link from 'next/link';
import { BriefcaseBusiness, FileSignature } from 'lucide-react';
import type { DossieLead } from '@/lib/crm/queries';
import styles from '../pagina.module.css';

export function AtalhoProposta({ lead }: { lead: DossieLead }) {
  if (lead.projetoAtivo) {
    return (
      <>
        {lead.propostaRecente && (
          <Link href={`/propostas/${lead.propostaRecente.id}`} className={styles.propostaExistente}>
            <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
            Ver proposta
          </Link>
        )}
        <Link href={`/solucoes/execucao/${lead.projetoAtivo.id}`} className={styles.criarProposta}>
          <BriefcaseBusiness size={16} strokeWidth={1.8} aria-hidden="true" />
          Abrir projeto
        </Link>
      </>
    );
  }

  if (lead.propostaRecente && lead.propostaRecente.status !== 'recusada') {
    return (
      <Link href={`/propostas/${lead.propostaRecente.id}`} className={styles.criarProposta}>
        <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
        Ver proposta
      </Link>
    );
  }

  return (
    <Link
      href={`/propostas/nova?oportunidade=${lead.oportunidade.id}`}
      className={styles.criarProposta}
    >
      <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
      {lead.propostaRecente ? 'Nova proposta' : 'Criar proposta'}
    </Link>
  );
}

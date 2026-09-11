import Link from 'next/link';
import { BriefcaseBusiness, FileSignature } from 'lucide-react';
import type { DossieLead } from '@/lib/crm/queries';
import { ROTULO_ABRIR_PROPOSTA } from '@/lib/propostas/status';
import styles from './CabecalhoDossie.module.css';

export function AtalhoProposta({
  lead,
  destaque = true,
  projetoSlug = null,
}: {
  lead: DossieLead;
  destaque?: boolean;
  projetoSlug?: string | null;
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
        <Link href={`/entregas/${projeto.id}`} className={styles.acaoPrimaria}>
          <BriefcaseBusiness size={16} strokeWidth={1.8} aria-hidden="true" />
          Abrir entrega
        </Link>
      </>
    );
  }

  if (lead.propostaRecente) {
    return (
      <Link href={`/propostas/${lead.propostaRecente.id}`} className={classeAcao}>
        <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
        {ROTULO_ABRIR_PROPOSTA[lead.propostaRecente.status]}
      </Link>
    );
  }

  const parametros = new URLSearchParams({ oportunidade: lead.oportunidade.id });
  if (projetoSlug) parametros.set('projeto', projetoSlug);

  return (
    <Link href={`/propostas/nova?${parametros.toString()}`} className={classeAcao}>
      <FileSignature size={16} strokeWidth={1.8} aria-hidden="true" />
      {lead.oportunidade.etapa === 'ganho' ? 'Registrar proposta' : 'Criar proposta'}
    </Link>
  );
}

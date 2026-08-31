import Link from 'next/link';
import { ArrowRight, FolderOpen, Plus } from 'lucide-react';
import type { ResumoProposta } from '@/lib/propostas/queries';
import { formatarReais } from '@/lib/propostas/schema';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import styles from '../pagina.module.css';

function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function CardProposta({
  proposta,
  tipo,
}: {
  proposta: ResumoProposta;
  tipo: 'rascunho' | 'enviada';
}) {
  return (
    <Link href={`/propostas/${proposta.id}`} className={styles.card}>
      <div className={styles.cardTopo}>
        <span className={styles.status} data-status={proposta.status}>
          {ROTULO_STATUS_PROPOSTA[proposta.status]}
        </span>
      </div>

      <div className={styles.cardCorpo}>
        <p>{proposta.empresa}</p>
        <h3>{proposta.titulo}</h3>
        <span>{proposta.projeto}</span>
      </div>

      <div className={styles.cardRodape}>
        <div>
          <strong>{formatarReais(proposta.valorCentavos)}</strong>
          <span>
            v{proposta.versao} · {dataCurta(proposta.atualizadoEm)}
          </span>
        </div>
        <span className={styles.cardAcao}>
          {tipo === 'rascunho' ? 'Continuar edição' : 'Ver proposta'}
          <ArrowRight size={15} strokeWidth={1.9} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

function ColecaoPropostas({
  titulo,
  propostas,
  tipo,
}: {
  titulo: string;
  propostas: ResumoProposta[];
  tipo: 'rascunho' | 'enviada';
}) {
  return (
    <section className={styles.colecao} aria-labelledby={`titulo-${tipo}`}>
      <header className={styles.colecaoTopo}>
        <div>
          <h2 id={`titulo-${tipo}`}>{titulo}</h2>
        </div>
        <strong className={styles.contagem} aria-label={`${propostas.length} propostas`}>
          {propostas.length.toString().padStart(2, '0')}
        </strong>
      </header>

      {propostas.length ? (
        <div className={styles.grade}>
          {propostas.map((proposta) => (
            <CardProposta proposta={proposta} tipo={tipo} key={proposta.id} />
          ))}
        </div>
      ) : (
        <div className={styles.colecaoVazia}>
          <FolderOpen size={20} strokeWidth={1.6} aria-hidden="true" />
          <div>
            <strong>
              {tipo === 'rascunho'
                ? 'Nenhuma proposta em rascunho.'
                : 'Nenhuma proposta enviada ainda.'}
            </strong>
            <span>
              {tipo === 'rascunho'
                ? 'Crie uma proposta para começar a trabalhar o documento.'
                : 'Quando uma proposta for enviada, ela aparecerá aqui com a decisão do cliente.'}
            </span>
          </div>
          {tipo === 'rascunho' && (
            <Link href="/propostas/nova" className={styles.acaoVazia}>
              Criar proposta <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export function PainelPropostas({ propostas }: { propostas: ResumoProposta[] }) {
  const rascunhos = propostas.filter(
    (proposta) => proposta.status === 'rascunho' || proposta.status === 'pronta',
  );
  const enviadas = propostas.filter(
    (proposta) => proposta.status !== 'rascunho' && proposta.status !== 'pronta',
  );

  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <div className={styles.heroTexto}>
          <span className={styles.sobretitulo}>Propostas</span>
          <h1>Biblioteca comercial</h1>
          <p>Rascunhos e propostas enviadas.</p>
        </div>
        <Link href="/propostas/nova" className={styles.nova}>
          <Plus size={17} strokeWidth={2} aria-hidden="true" />
          Nova proposta
        </Link>
      </header>

      <div className={styles.colecoes}>
        <ColecaoPropostas titulo="Rascunhos" propostas={rascunhos} tipo="rascunho" />
        <ColecaoPropostas titulo="Propostas enviadas" propostas={enviadas} tipo="enviada" />
      </div>
    </div>
  );
}

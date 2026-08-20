import Link from 'next/link';
import {
  ArrowRight,
  FileSignature,
  FolderOpen,
  Layers3,
  PencilLine,
  Plus,
  Send,
} from 'lucide-react';
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
        <span className={styles.iconeDocumento} aria-hidden="true">
          <FileSignature size={19} strokeWidth={1.7} />
        </span>
        <span className={styles.status} data-status={proposta.status}>
          {ROTULO_STATUS_PROPOSTA[proposta.status]}
        </span>
      </div>

      <div className={styles.cardCorpo}>
        <p>{proposta.empresa}</p>
        <h3>{proposta.projeto}</h3>
        <span>{proposta.titulo}</span>
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
  descricao,
  propostas,
  tipo,
}: {
  titulo: string;
  descricao: string;
  propostas: ResumoProposta[];
  tipo: 'rascunho' | 'enviada';
}) {
  const Icone = tipo === 'rascunho' ? PencilLine : Send;

  return (
    <section className={styles.colecao} aria-labelledby={`titulo-${tipo}`}>
      <header className={styles.colecaoTopo}>
        <span className={styles.iconeColecao} aria-hidden="true">
          <Icone size={19} strokeWidth={1.7} />
        </span>
        <div>
          <p className={styles.sobretitulo}>
            {tipo === 'rascunho' ? 'Em construção' : 'Com o cliente'}
          </p>
          <h2 id={`titulo-${tipo}`}>{titulo}</h2>
          <p>{descricao}</p>
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
  const aceitas = propostas.filter((proposta) => proposta.status === 'aceita').length;
  const valorEnviado = propostas
    .filter((proposta) => proposta.status === 'apresentada' || proposta.status === 'aceita')
    .reduce((total, proposta) => total + (proposta.valorCentavos ?? 0), 0);

  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <div className={styles.heroIcone} aria-hidden="true">
          <Layers3 size={22} strokeWidth={1.6} />
        </div>
        <div className={styles.heroTexto}>
          <p className={styles.sobretitulo}>Propostas</p>
          <h1>Biblioteca comercial</h1>
          <p>Encontre o que ainda precisa de revisão e acompanhe o que já está com o cliente.</p>
        </div>
        <Link href="/propostas/nova" className={styles.nova}>
          <Plus size={17} strokeWidth={2} aria-hidden="true" />
          Nova proposta
        </Link>
      </header>

      <section className={styles.resumo} aria-label="Resumo da biblioteca comercial">
        <article data-destaque="true">
          <span>Em rascunho</span>
          <strong>{rascunhos.length}</strong>
          <small>para revisar ou concluir</small>
        </article>
        <article>
          <span>Enviadas</span>
          <strong>{enviadas.length}</strong>
          <small>já compartilhadas</small>
        </article>
        <article>
          <span>Aprovadas</span>
          <strong>{aceitas}</strong>
          <small>vendas confirmadas</small>
        </article>
        <article>
          <span>Valor enviado</span>
          <strong>{formatarReais(valorEnviado)}</strong>
          <small>em negociação ou aprovado</small>
        </article>
      </section>

      <div className={styles.colecoes}>
        <ColecaoPropostas
          titulo="Em rascunho"
          descricao="Documentos que ainda podem ser revisados antes do envio."
          propostas={rascunhos}
          tipo="rascunho"
        />
        <ColecaoPropostas
          titulo="Enviadas"
          descricao="Propostas que já chegaram ao cliente e aguardam ou já receberam uma decisão."
          propostas={enviadas}
          tipo="enviada"
        />
      </div>
    </div>
  );
}

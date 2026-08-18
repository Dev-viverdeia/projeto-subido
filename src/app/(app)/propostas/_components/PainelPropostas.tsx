import Link from 'next/link';
import { ArrowUpRight, FileSignature, Plus, Layers3 } from 'lucide-react';
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

export function PainelPropostas({ propostas }: { propostas: ResumoProposta[] }) {
  const emPreparacao = propostas.filter(
    (proposta) => proposta.status === 'rascunho' || proposta.status === 'pronta',
  ).length;
  const emDecisao = propostas.filter((proposta) => proposta.status === 'apresentada').length;
  const aceitas = propostas.filter((proposta) => proposta.status === 'aceita').length;
  const valorEmJogo = propostas
    .filter((proposta) => proposta.status !== 'recusada' && proposta.status !== 'aceita')
    .reduce((total, proposta) => total + (proposta.valorCentavos ?? 0), 0);

  return (
    <div className={styles.pagina}>
      <header className={styles.hero} data-on-dark>
        <div className={styles.heroTexto}>
          <p className={styles.sobretitulo}>Propostas comerciais</p>
          <h1>Crie e acompanhe propostas.</h1>
          <p>
            Use os dados do CRM e um projeto como base. Revise o texto antes de apresentar ao
            cliente.
          </p>
        </div>
        <Link href="/propostas/nova" className={styles.nova}>
          <Plus size={17} strokeWidth={2} aria-hidden="true" />
          Nova proposta
        </Link>

        <div className={styles.linhaDecisao} aria-label="Fluxo da proposta">
          <span>Lead</span>
          <i />
          <span>Projeto</span>
          <i />
          <span>Proposta</span>
          <i />
          <strong>Decisão</strong>
        </div>
      </header>

      <section className={styles.resumo} aria-label="Resumo das propostas">
        <article data-destaque="true">
          <span>Em preparação</span>
          <strong>{emPreparacao}</strong>
          <small>documentos para revisar</small>
        </article>
        <article>
          <span>Em decisão</span>
          <strong>{emDecisao}</strong>
          <small>aguardando o cliente</small>
        </article>
        <article>
          <span>Aceitas</span>
          <strong>{aceitas}</strong>
          <small>projetos fechados</small>
        </article>
        <article>
          <span>Valor em jogo</span>
          <strong>{formatarReais(valorEmJogo)}</strong>
          <small>em propostas abertas</small>
        </article>
      </section>

      {propostas.length ? (
        <section className={styles.lista} aria-label="Suas propostas">
          <header className={styles.listaTopo}>
            <div>
              <p className={styles.sobretitulo}>Suas propostas</p>
              <h2>Propostas recentes</h2>
            </div>
            <span>
              {propostas.length} {propostas.length === 1 ? 'documento' : 'documentos'}
            </span>
          </header>
          <div className={styles.grade}>
            {propostas.map((proposta) => (
              <Link href={`/propostas/${proposta.id}`} className={styles.card} key={proposta.id}>
                <div className={styles.cardTopo}>
                  <span className={styles.iconeDocumento}>
                    <FileSignature size={20} strokeWidth={1.7} aria-hidden="true" />
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
                  <ArrowUpRight size={18} strokeWidth={1.8} aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.vazio}>
          <span>
            <Layers3 size={22} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <p className={styles.sobretitulo}>Primeira proposta</p>
          <h2>Crie uma proposta para uma oportunidade do CRM.</h2>
          <p>
            Escolha a oportunidade e o projeto. A plataforma prepara um rascunho para você revisar,
            salvar e baixar em PDF.
          </p>
          <Link href="/propostas/nova" className={styles.nova}>
            Criar primeira proposta <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}

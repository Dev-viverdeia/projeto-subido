import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, FileSignature, Plus, Sparkles } from 'lucide-react';
import { listarPropostas } from '@/lib/propostas/queries';
import { formatarReais } from '@/lib/propostas/schema';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Propostas comerciais' };

function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export default async function PropostasPage() {
  const propostas = await listarPropostas();

  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <div>
          <p className={styles.sobretitulo}>Propostas comerciais</p>
          <h1>Do diagnóstico à decisão.</h1>
          <p>
            Transforme o contexto real do CRM e seus Projetos em um documento claro, pronto para
            apresentar.
          </p>
        </div>
        <Link href="/propostas/nova" className={styles.nova}>
          <Plus size={17} strokeWidth={2} aria-hidden="true" />
          Nova proposta
        </Link>
      </header>

      <div className={styles.linhaDecisao} aria-hidden="true">
        <span>Contexto</span>
        <i />
        <span>Projeto</span>
        <i />
        <span>Proposta</span>
        <i />
        <strong>Decisão</strong>
      </div>

      {propostas.length ? (
        <section className={styles.lista} aria-label="Suas propostas">
          <header className={styles.listaTopo}>
            <h2>Documentos recentes</h2>
            <span>{propostas.length}</span>
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
            <Sparkles size={22} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <p className={styles.sobretitulo}>Primeiro documento</p>
          <h2>Seu trabalho já está no sistema. Falta apresentá-lo.</h2>
          <p>
            Escolha um lead do CRM e um Projeto. A plataforma organiza o primeiro rascunho para você
            revisar, salvar e baixar em PDF.
          </p>
          <Link href="/propostas/nova" className={styles.nova}>
            Criar primeira proposta <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  );
}

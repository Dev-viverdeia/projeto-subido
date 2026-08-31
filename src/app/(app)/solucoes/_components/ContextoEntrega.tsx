import Link from 'next/link';
import { FileCheck2, FileSignature, FolderKanban } from 'lucide-react';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { PortalClienteCard } from './PortalClienteCard';
import { PrazoProjeto } from './PrazoProjeto';
import { MudancasEscopoProjeto } from './MudancasEscopoProjeto';
import styles from './SalaEntrega.module.css';

export function ContextoEntrega({
  projeto,
  briefingConfirmado,
}: {
  projeto: ProjetoExecucaoCompleto;
  briefingConfirmado: boolean;
}) {
  return (
    <div className={styles.contextoGrid}>
      <MudancasEscopoProjeto projetoId={projeto.id} mudancas={projeto.mudancasEscopo} />
      <div className={styles.contextoColuna}>
        {projeto.feitas > 0 && <PrazoProjeto projetoId={projeto.id} prazo={projeto.prazoEm} />}
        <section className={styles.cliente}>
          <p>Cliente</p>
          <h2>{projeto.empresa}</h2>
          <blockquote>{projeto.documento.objetivo}</blockquote>
          <div>
            <Link href={`/vendas/${projeto.oportunidadeId}`}>
              <FolderKanban size={15} aria-hidden="true" /> Abrir em Vendas
            </Link>
            <Link href={`/propostas/${projeto.propostaId}`}>
              <FileSignature size={15} aria-hidden="true" /> Ver proposta
            </Link>
          </div>
        </section>
      </div>

      <div className={styles.contextoColuna}>
        <PortalClienteCard
          projetoId={projeto.id}
          ativo={projeto.portalAtivo}
          codigo={projeto.portalCodigo}
          briefingConfirmado={briefingConfirmado}
        />
        <section className={styles.entregaveis}>
          <p>Entrega combinada</p>
          <ul>
            {projeto.documento.entregaveis.map((entregavel) => (
              <li key={entregavel}>
                <FileCheck2 size={15} aria-hidden="true" /> {entregavel}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

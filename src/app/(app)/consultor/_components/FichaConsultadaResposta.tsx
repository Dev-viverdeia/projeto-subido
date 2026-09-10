import Link from 'next/link';
import { ArrowUpRight, ChevronDown, FileText } from 'lucide-react';
import type { FichaConsultada } from '@/lib/consultor/cliente';
import styles from './FichaConsultadaResposta.module.css';

function dataCurta(valor: string | null): string {
  if (!valor || Number.isNaN(Date.parse(valor))) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(valor));
}

/** Recibo da leitura do servidor, não uma afirmação de citação feita pelo modelo. */
export function FichaConsultadaResposta({ ficha }: { ficha?: FichaConsultada | null }) {
  if (!ficha) return null;
  return (
    <details className={styles.ficha}>
      <summary>
        <FileText size={18} aria-hidden="true" />
        <span>
          {ficha.incompleta ? 'Ficha consultada em parte' : 'Ficha consultada'}{' '}
          <strong>{ficha.empresa}</strong>
        </span>
        <ChevronDown size={16} aria-hidden="true" className={styles.seta} />
      </summary>
      <div className={styles.conteudo}>
        <p>Resumo dos registros disponíveis em {dataCurta(ficha.consultadaEm)}.</p>
        {ficha.incompleta && <p role="status">Parte da ficha não pôde ser lida nesta resposta.</p>}
        <dl>
          {ficha.fontes.map((fonte) => (
            <div key={fonte.nome}>
              <dt>{fonte.nome}</dt>
              <dd>
                {fonte.registros} {fonte.registros === 1 ? 'trecho' : 'trechos'} ·{' '}
                {dataCurta(fonte.atualizadaEm)}
              </dd>
            </div>
          ))}
        </dl>
        <Link href={`/vendas/${ficha.oportunidadeId}`}>
          Conferir ficha <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </details>
  );
}

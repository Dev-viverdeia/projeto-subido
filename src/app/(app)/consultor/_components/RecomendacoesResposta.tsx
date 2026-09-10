import Link from 'next/link';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { IconeProduto } from '@/components/brand/IconeProduto';
import type { CartaoProduto } from '@/lib/consultor/conteudo';
import styles from './LeituraResposta.module.css';

const TIPOS = {
  aula: { icone: 'formacoes', acao: 'Abrir aula' },
  formacao: { icone: 'formacoes', acao: 'Abrir formação' },
  projeto: { icone: 'projetos', acao: 'Abrir projeto' },
  ferramenta: { icone: 'estudio', acao: 'Ver no projeto' },
} as const;

function Recomendacao({ cartao }: { cartao: CartaoProduto }) {
  const tipo = TIPOS[cartao.tipo];
  return (
    <article className={styles.recomendacao}>
      <Link
        href={cartao.href}
        className={styles.recurso}
        aria-label={`${tipo.acao}: ${cartao.titulo}`}
      >
        <span className={styles.icone}>
          <IconeProduto nome={tipo.icone} tamanho={23} />
        </span>
        <span className={styles.recursoTexto}>
          <span className={styles.rotulo}>{cartao.rotulo}</span>
          <strong>{cartao.titulo}</strong>
        </span>
        <ArrowUpRight size={19} aria-hidden="true" />
      </Link>
      <details className={styles.motivo}>
        <summary>
          Por que esta indicação? <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <p>{cartao.motivo}</p>
      </details>
    </article>
  );
}

/** Preserva a ordem validada pelo catálogo, sem inventar ranking ou conteúdo. */
export function RecomendacoesResposta({ cartoes }: { cartoes: CartaoProduto[] }) {
  const [primeiro, ...outros] = cartoes;
  if (!primeiro) return null;
  return (
    <section className={styles.recomendacoes} aria-label="Conteúdos recomendados">
      <Recomendacao cartao={primeiro} />
      {outros.length > 0 ? (
        <details className={styles.maisRecomendacoes}>
          <summary>
            <span className={styles.quandoFechado}>
              Mais {outros.length} {outros.length === 1 ? 'recomendação' : 'recomendações'}
            </span>
            <span className={styles.quandoAberto}>Recolher recomendações</span>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <ul>
            {outros.map((cartao) => (
              <li key={`${cartao.tipo}:${cartao.chave}`}>
                <Recomendacao cartao={cartao} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

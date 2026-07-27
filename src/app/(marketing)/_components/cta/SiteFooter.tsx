import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { FOOTER } from '@/content/landing';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from './SiteFooter.module.css';

/**
 * Rodapé.
 *
 * POR QUE ELE NÃO É ENFEITE NUMA PÁGINA DE VENDA
 * Quem chega ao fim de uma página de 11 mil pixels está em um de três estados: quer
 * voltar para uma seção, quer falar com alguém antes de decidir, ou está conferindo
 * as regras. As três colunas existem para esses três — não para preencher espaço.
 *
 * E a linha legal não é opcional: venda online no Brasil exige razão social, CNPJ e
 * endereço visíveis (CDC art. 33 e Decreto 7.962/2013). Faltando isso, a página está
 * irregular independentemente de quão bonita esteja.
 */
export function SiteFooter() {
  const ano = 2026;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <SubidoLogo size={20} />
          <p className={styles.tagline}>{FOOTER.tagline}</p>
        </div>

        <div className={styles.colunas}>
          {FOOTER.colunas.map((coluna) => (
            <nav key={coluna.titulo} className={styles.coluna} aria-label={coluna.titulo}>
              <h2 className={styles.colunaTitulo}>{coluna.titulo}</h2>
              <ul className={styles.lista}>
                {coluna.links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                        <ArrowUpRight size={13} strokeWidth={2} aria-hidden />
                      </a>
                    ) : (
                      /* Âncoras da própria página continuam <a>; rotas reais usam Link
                         para não recarregar o documento inteiro. */
                      <Link href={link.href} className={styles.link}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className={styles.legal}>
        <div className={styles.legalInner}>
          <p className={styles.razao}>
            {FOOTER.razaoSocial} · {FOOTER.cnpj}
            <br />
            {FOOTER.endereco}
          </p>
          <p className={styles.copy}>© {ano} Subido. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

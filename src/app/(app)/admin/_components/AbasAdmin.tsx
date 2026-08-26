'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AbasAdmin.module.css';

const ABAS = [
  { href: '/admin', rotulo: 'Visão geral' },
  { href: '/admin/acessos', rotulo: 'Acessos e créditos' },
  { href: '/admin/custos', rotulo: 'Custos e margem' },
  { href: '/admin/operacoes', rotulo: 'Operações' },
  { href: '/admin/solucoes', rotulo: 'Soluções' },
  { href: '/admin/formacoes', rotulo: 'Formações' },
  { href: '/admin/mentorias', rotulo: 'Mentorias' },
] as const;

/**
 * Navegação entre as áreas de administração.
 *
 * Cliente por causa do `usePathname`. A comparação de "Visão geral" é por
 * igualdade e as outras por prefixo: `/admin` é prefixo de TODAS as rotas daqui,
 * então um `startsWith` uniforme deixaria a primeira aba sempre acesa.
 */
export function AbasAdmin() {
  const caminho = usePathname();

  return (
    <nav className={styles.abas} aria-label="Áreas de administração">
      {ABAS.map((aba) => {
        const ativa =
          aba.href === '/admin'
            ? caminho === '/admin'
            : caminho === aba.href || caminho.startsWith(`${aba.href}/`);

        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={styles.aba}
            aria-current={ativa ? 'page' : undefined}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

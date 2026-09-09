import type { Metadata } from 'next';
import Link from 'next/link';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import s from '@/components/suporte/suporte.module.css';
export const metadata: Metadata = {
  title: 'Central de ajuda',
  alternates: { canonical: '/ajuda' },
  referrer: 'no-referrer',
};
export default function AjudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.publico}>
      <a className="via-skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className={s.marca}>
        <Link href="/ajuda" aria-label="Central de ajuda do Subido">
          <SubidoLogo size={17} />
        </Link>
        <Link href="/suporte" className={s.atalho}>
          Minha conta
        </Link>
      </header>
      <main id="conteudo">{children}</main>
    </div>
  );
}

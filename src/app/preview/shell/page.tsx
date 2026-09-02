import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapaJornada } from '@/app/(app)/inicio/_components/MapaJornada';
import { CabecalhoApp } from '@/app/(app)/_components/CabecalhoApp';
import { NavLateral } from '@/app/(app)/_components/NavLateral';
import { ITEM_CONTA, ITENS_NAV } from '@/app/(app)/_components/navegacao';
import { ProvedorDeTrilha } from '@/app/(app)/_components/trilha/contexto';
import shellStyles from '@/app/(app)/layout.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';

export const metadata: Metadata = { title: 'Preview · Shell da plataforma' };

/**
 * Bancada visual do shell autenticado. Usa os componentes e o CSS reais para a
 * validação local não aprovar uma moldura diferente da que chega ao usuário.
 */
export default function PreviewShellPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <ProvedorDeTrilha>
      <div className={shellStyles.shell}>
        <a href="#conteudo" className="via-skip-link">
          Pular para o conteúdo
        </a>

        <aside className={shellStyles.sidebar}>
          <Link href="/inicio" className={shellStyles.marcaSidebar} aria-label="Ir para o início">
            <SubidoLogo size={18} />
          </Link>
          <NavLateral itens={ITENS_NAV} variante="lateral" caminhoAtual="/inicio" />
        </aside>

        <CabecalhoApp
          nome="Mateus"
          email="mateus@exemplo.com"
          saldoCreditos={84}
          plano="pro"
          pendencias={[]}
          logo={<SubidoLogo size={17} />}
        />

        <main className={shellStyles.conteudo} id="conteudo">
          <MapaJornada nome="Mateus" plano="pro" />
        </main>

        <NavLateral
          itens={ITENS_NAV}
          itemConta={ITEM_CONTA}
          variante="dock"
          caminhoAtual="/inicio"
        />
      </div>
    </ProvedorDeTrilha>
  );
}

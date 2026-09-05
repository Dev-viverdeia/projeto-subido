import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapaJornada } from '@/app/(app)/inicio/_components/MapaJornada';
import { CabecalhoApp } from '@/app/(app)/_components/CabecalhoApp';
import { NavLateral } from '@/app/(app)/_components/NavLateral';
import { ITEM_ADMIN, ITEM_CONTA, ITENS_NAV } from '@/app/(app)/_components/navegacao';
import { DefinirTrilha, ProvedorDeTrilha } from '@/app/(app)/_components/trilha/contexto';
import {
  PLANOS_SUBIDO,
  RECURSOS_SUBIDO,
  destinoDeUpgrade,
  planoPodeAcessarRota,
  recursoDaRota,
} from '@/lib/planos/acessos';
import shellStyles from '@/app/(app)/layout.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { FormacoesVista } from '@/app/(app)/formacoes/_components/FormacoesVista';
import { CatalogoProjetos } from '@/app/(app)/solucoes/_components/CatalogoProjetos';
import { FORMACOES_DEMO } from '../formacoes/fixture';
import { projetosPreview } from '../projetos/fixture';
import { ProgressoPreview } from '../ProgressoPreview';

export const metadata: Metadata = { title: 'Preview · Shell da plataforma' };

/**
 * Bancada visual do shell autenticado. Usa os componentes e o CSS reais para a
 * validação local não aprovar uma moldura diferente da que chega ao usuário.
 */
export default async function PreviewShellPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string; nome?: string; tela?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const params = await searchParams;
  const plano = params.plano === 'starter' ? 'starter' : 'pro';
  const nome = params.nome === 'longo' ? 'Maria Aparecida de Albuquerque' : 'Mateus';
  const tela = params.tela === 'formacoes' || params.tela === 'projetos' ? params.tela : 'inicio';
  const caminho = tela === 'projetos' ? '/solucoes' : `/${tela}`;
  const itens = ITENS_NAV.map((item) => {
    const recurso = recursoDaRota(item.href);
    const bloqueado = !planoPodeAcessarRota(plano, item.href);
    return {
      ...item,
      bloqueado,
      destinoBloqueado: bloqueado && recurso ? destinoDeUpgrade(recurso, item.href) : undefined,
      planoNecessario:
        bloqueado && recurso ? PLANOS_SUBIDO[RECURSOS_SUBIDO[recurso].planoMinimo].nome : undefined,
    };
  });

  return (
    <ProvedorDeTrilha>
      <DefinirTrilha
        atual={tela === 'formacoes' ? 'Formações' : tela === 'projetos' ? 'Projetos' : 'Início'}
      />
      <div className={shellStyles.shell} data-app-shell>
        <a href="#conteudo" className="via-skip-link">
          Pular para o conteúdo
        </a>

        <aside className={shellStyles.sidebar}>
          <Link href="/inicio" className={shellStyles.marcaSidebar} aria-label="Ir para o início">
            <SubidoLogo size={18} />
          </Link>
          <NavLateral itens={itens} variante="lateral" caminhoAtual={caminho} />
          <div className={shellStyles.rodapeSidebar}>
            <NavLateral
              itens={[ITEM_ADMIN]}
              variante="lateral"
              grupo="admin"
              rotuloGrupo="Gestão"
            />
          </div>
        </aside>

        <CabecalhoApp
          nome={nome}
          email="mateus@exemplo.com"
          saldoCreditos={84}
          plano={plano}
          pendencias={[]}
          logo={<SubidoLogo size={17} />}
        />

        <main className={shellStyles.conteudo} id="conteudo">
          <ProgressoPreview>
            {tela === 'formacoes' ? (
              <FormacoesVista formacoes={FORMACOES_DEMO} />
            ) : tela === 'projetos' ? (
              <CatalogoProjetos solucoes={projetosPreview} />
            ) : (
              <MapaJornada nome={nome} plano={plano} />
            )}
          </ProgressoPreview>
        </main>

        <NavLateral
          itens={[...itens, ITEM_ADMIN]}
          itemConta={ITEM_CONTA}
          variante="dock"
          caminhoAtual={caminho}
        />
      </div>
    </ProvedorDeTrilha>
  );
}

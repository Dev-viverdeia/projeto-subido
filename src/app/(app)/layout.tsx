import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { QueryProvider } from '@/lib/query/provider';
import { createClient } from '@/lib/supabase/server';
import { ROTA_ENTRAR } from '@/lib/routes';
import { ehAdmin } from '@/lib/auth/papeis';
import { ITEM_ADMIN, ITENS_NAV } from './_components/navegacao';
import { NavLateral } from './_components/NavLateral';
import { CabecalhoApp } from './_components/CabecalhoApp';
import styles from './layout.module.css';

/**
 * Shell da plataforma autenticada.
 *
 * O `redirect` daqui é a SEGUNDA barreira, não a primeira — o proxy já barrou quem
 * não tem sessão antes desta árvore renderizar. Ele existe mesmo assim porque as
 * duas listas (matcher e rotas) podem divergir por descuido, e o custo de uma
 * checagem redundante é uma chamada que já aconteceu de qualquer jeito: precisamos
 * dos claims aqui para montar o bloco de usuário.
 *
 * `getClaims()` e não `getUser()`: o claims é verificado localmente contra a chave
 * assimétrica, sem uma ida de rede ao servidor de auth em CADA navegação.
 *
 * O QueryProvider mora aqui e só aqui. A landing nunca o carrega — é isso que
 * mantém o bundle de `(marketing)` sem React Query.
 */
export default async function AppLayout({
  children,
  trilha,
}: {
  children: ReactNode;
  /* Slot paralelo `@trilha`. Ele existe porque o cabeçalho vive no layout e o
     layout não enxerga o dado da página — e passar título por contexto de cliente
     custaria um pisca de "seção primeiro, título depois" a cada navegação. Com o
     slot, a trilha é renderizada no servidor, com o título real, no mesmo request.
     As consultas são `cache()` do React: o slot e a página compartilham o
     resultado, sem segunda ida ao banco. */
  trilha: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data) redirect(ROTA_ENTRAR);

  const claims = data.claims;
  const email = typeof claims.email === 'string' ? claims.email : '';
  const metadata = claims.user_metadata;
  const nomeBruto = typeof metadata?.nome === 'string' ? metadata.nome : '';
  /* Antes do primeiro cadastro completo o nome pode não existir. O trecho antes do
     @ é um fallback previsível — melhor que "Usuário" e melhor que vazio. */
  const nome = nomeBruto || email.split('@')[0] || 'Sua conta';

  /* Montado por sessão: quem não é admin não recebe o item no payload RSC — nem
     o rótulo, nem o destino. Esconder por CSS deixaria a rota exposta no HTML de
     todo mundo. */
  const admin = await ehAdmin();

  return (
    <QueryProvider>
      <div className={styles.shell}>
        <a href="#conteudo" className="via-skip-link">
          Pular para o conteúdo
        </a>

        {/* O trilho navy: a banda escura da landing e das telas de sessão, em pé.
            A marca azul sobre a navy é o mesmo quadro de /entrar — o produto
            inteiro abre e fecha na mesma assinatura. O item de admin é UTILITÁRIO,
            não pilar: mora ancorado no pé do trilho, separado por hairline. */}
        <aside className={`${styles.sidebar} via-noise`}>
          <Link href="/inicio" className={styles.marcaSidebar} aria-label="Ir para o início">
            <SubidoLogo size={18} />
          </Link>

          <NavLateral itens={ITENS_NAV} variante="lateral" rotuloGrupo="Plataforma" />

          {admin && (
            <div className={styles.rodapeSidebar}>
              <NavLateral
                itens={[ITEM_ADMIN]}
                variante="lateral"
                grupo="admin"
                rotuloGrupo="Gestão"
              />
            </div>
          )}
        </aside>

        {/* O logo entra por prop já renderizado: o CabecalhoApp é Client Component
            (usa usePathname) e receber o SVG pronto do servidor evita puxar a marca
            para o bundle do browser. Só aparece no mobile — em desktop a sidebar
            já carrega a marca, e repetir seria a segunda vez na mesma tela. */}
        <CabecalhoApp nome={nome} email={email} logo={<SubidoLogo size={16} />} trilha={trilha} />

        <main className={styles.conteudo} id="conteudo">
          {children}
        </main>

        {/* O dock nunca carrega o admin (noDock) — a lista base basta. */}
        <NavLateral itens={ITENS_NAV} variante="dock" />
      </div>
    </QueryProvider>
  );
}

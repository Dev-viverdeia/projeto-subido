import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CoBrandLockup } from '@/components/brand/CoBrandLockup';
import { QueryProvider } from '@/lib/query/provider';
import { createClient } from '@/lib/supabase/server';
import { ROTA_ENTRAR } from '@/lib/routes';
import { ITENS_NAV } from './_components/navegacao';
import { NavLateral } from './_components/NavLateral';
import { BlocoUsuario } from './_components/BlocoUsuario';
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
export default async function AppLayout({ children }: { children: ReactNode }) {
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

  return (
    <QueryProvider>
      <div className={styles.shell}>
        <a href="#conteudo" className="via-skip-link">
          Pular para o conteúdo
        </a>

        <header className={styles.barraTopo}>
          <Link href="/inicio" className={styles.marca} aria-label="Ir para o início">
            <CoBrandLockup size={13} />
          </Link>
          {/* `compacto`: só o avatar. Com nome e e-mail a barra media 540px em
              375px de viewport e a página ganhava scroll horizontal. */}
          <BlocoUsuario nome={nome} email={email} compacto />
        </header>

        <aside className={styles.sidebar}>
          <Link href="/inicio" className={styles.marcaSidebar} aria-label="Ir para o início">
            {/* 13, não 16. O wordmark tem proporção ~12:1, então a altura da
                cap-height multiplica por doze na largura: a 16 o lockup mede 275px
                e a sidebar oferece 232px úteis — ele vazava 39px para dentro do
                conteúdo. A 13 mede 223px e sobra folga. */}
            <CoBrandLockup size={13} />
          </Link>

          <NavLateral itens={ITENS_NAV} variante="lateral" />

          <div className={styles.rodapeSidebar}>
            <BlocoUsuario nome={nome} email={email} />
          </div>
        </aside>

        <main className={styles.conteudo} id="conteudo">
          {children}
        </main>

        <NavLateral itens={ITENS_NAV} variante="dock" />
      </div>
    </QueryProvider>
  );
}

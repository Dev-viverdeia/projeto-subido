import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { QueryProvider } from '@/lib/query/provider';
import { createClient } from '@/lib/supabase/server';
import { ROTA_ENTRAR } from '@/lib/routes';
import { ehAdmin } from '@/lib/auth/papeis';
import { concluiuIntroducaoSubido } from '@/lib/auth/introducao';
import { obterSaldoCreditos } from '@/lib/creditos/queries';
import { planoDosMetadados, planoPodeAcessarRota } from '@/lib/planos/acessos';
import { ITEM_ADMIN, ITEM_CONTA, ITENS_NAV } from './_components/navegacao';
import { NavLateral } from './_components/NavLateral';
import { CabecalhoApp } from './_components/CabecalhoApp';
import { ProvedorDeTrilha } from './_components/trilha/contexto';
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
  /* A leitura do papel não depende do resultado de `getClaims`: as duas usam a
     mesma sessão já validada pelo proxy. Iniciá-las juntas elimina uma viagem
     sequencial ao banco em toda navegação da área logada. */
  const [{ data }, admin, saldoCreditos] = await Promise.all([
    supabase.auth.getClaims(),
    ehAdmin(),
    obterSaldoCreditos(),
  ]);

  if (!data) redirect(ROTA_ENTRAR);

  const claims = data.claims;
  const email = typeof claims.email === 'string' ? claims.email : '';
  const metadata = claims.user_metadata;
  const plano = planoDosMetadados(claims.app_metadata);
  const itensComAcesso = ITENS_NAV.map((item) => ({
    ...item,
    bloqueado: !planoPodeAcessarRota(plano, item.href),
  }));
  const concluiuIntroducao = concluiuIntroducaoSubido(metadata);

  /* A introdução é parte do produto, não uma página solta. O status fica no
     token autenticado para esta barreira não acrescentar uma consulta ao banco
     em cada navegação. */
  if (!concluiuIntroducao) redirect('/boas-vindas');

  const nomeBruto = typeof metadata?.nome === 'string' ? metadata.nome : '';
  /* Antes do primeiro cadastro completo o nome pode não existir. O trecho antes do
     @ é um fallback previsível — melhor que "Usuário" e melhor que vazio. */
  const nome = nomeBruto || email.split('@')[0] || 'Sua conta';

  /* Montado por sessão: quem não é admin não recebe o item no payload RSC — nem
     o rótulo, nem o destino. Esconder por CSS deixaria a rota exposta no HTML de
     todo mundo. */
  return (
    <QueryProvider>
      {/* O provedor abraça o shell porque quem ESCREVE a trilha é a página, lá
          dentro, e quem LÊ é o cabeçalho, aqui em cima. O progresso, por outro
          lado, mora apenas nas quatro áreas que realmente o consomem. */}
      <ProvedorDeTrilha>
        <div className={styles.shell}>
          <a href="#conteudo" className="via-skip-link">
            Pular para o conteúdo
          </a>

          <aside className={styles.sidebar}>
            <Link href="/inicio" className={styles.marcaSidebar} aria-label="Ir para o início">
              <SubidoLogo size={18} />
              <strong>Sistema operacional do profissional de IA</strong>
              <small>Em colaboração com Viver de IA</small>
            </Link>

            <NavLateral itens={itensComAcesso} variante="lateral" />

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

          <CabecalhoApp
            nome={nome}
            email={email}
            saldoCreditos={saldoCreditos}
            plano={plano}
            logo={<SubidoLogo size={17} />}
          />

          <main className={styles.conteudo} id="conteudo">
            {children}
          </main>

          {/* No mobile, "Mais" dá acesso à navegação completa. O item de gestão
              só entra no payload de quem realmente é admin. */}
          <NavLateral
            itens={admin ? [...itensComAcesso, ITEM_ADMIN] : itensComAcesso}
            itemConta={ITEM_CONTA}
            variante="dock"
          />
        </div>
      </ProvedorDeTrilha>
    </QueryProvider>
  );
}

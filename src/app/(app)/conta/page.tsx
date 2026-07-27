import type { Metadata } from 'next';
import { CircleUser } from 'lucide-react';
import { Card, EmptyState } from '@/design-system/via';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Conta' };

/**
 * Primeira tela que lê dados reais — os claims da sessão.
 *
 * Vem do JWT já verificado, não de uma consulta: nome e e-mail estão no token, e
 * uma ida ao banco para buscá-los seria uma query por navegação sem nenhuma
 * informação a mais. Perfil, assinatura e certificados são outra história e ainda
 * dependem de tabela.
 */
export default async function ContaPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const email = typeof claims?.email === 'string' ? claims.email : '—';
  const metadata = claims?.user_metadata;
  const nome = typeof metadata?.nome === 'string' ? metadata.nome : '—';

  return (
    <>
      <CabecalhoPagina titulo="Conta" descricao="Seus dados, sua assinatura e seus certificados." />

      <Card variant="default" className={styles.cartao}>
        <h2 className={styles.subtitulo}>Dados de acesso</h2>
        <dl className={styles.lista}>
          <div className={styles.linha}>
            <dt className={styles.rotulo}>Nome</dt>
            <dd className={styles.valor}>{nome}</dd>
          </div>
          <div className={styles.linha}>
            <dt className={styles.rotulo}>E-mail</dt>
            <dd className={styles.valor}>{email}</dd>
          </div>
        </dl>
      </Card>

      <div className={styles.espaco}>
        <EmptyState
          icon={<CircleUser size={20} strokeWidth={1.8} />}
          title="Assinatura e certificados ainda não estão conectados"
          description="Plano, status de pagamento e certificados emitidos aparecem aqui quando o banco e o provedor de pagamento estiverem de pé."
        />
      </div>
    </>
  );
}

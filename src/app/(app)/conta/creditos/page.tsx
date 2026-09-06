import type { Metadata } from 'next';
import { obterCatalogoBilling } from '@/lib/billing/catalogo';
import { obterCarteiraCreditos } from '@/lib/creditos/queries';
import { planoDosMetadados } from '@/lib/planos/acessos';
import { createClient } from '@/lib/supabase/server';
import { RetornoCheckout } from '../_components/RetornoCheckout';
import { PainelCreditos } from './PainelCreditos';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Créditos' };

export default async function CreditosPage({ searchParams }: PageProps<'/conta/creditos'>) {
  const supabase = await createClient();
  const [{ data }, carteira, catalogo, parametros] = await Promise.all([
    supabase.auth.getUser(),
    obterCarteiraCreditos(10),
    obterCatalogoBilling(),
    searchParams,
  ]);
  const retorno = typeof parametros.checkout === 'string' ? parametros.checkout : undefined;
  const sessao = typeof parametros.session_id === 'string' ? parametros.session_id : undefined;
  return (
    <div className={styles.pagina}>
      <RetornoCheckout
        key={`${retorno}:${sessao}`}
        retorno={retorno}
        sessao={sessao}
        tipo="creditos"
      />
      <PainelCreditos
        plano={planoDosMetadados(data.user?.app_metadata)}
        carteira={carteira}
        catalogo={catalogo}
      />
    </div>
  );
}

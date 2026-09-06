import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { obterCatalogoBilling } from '@/lib/billing/catalogo';
import { obterAssinaturaAtual } from '@/lib/billing/queries';
import { obterConfiguracaoBilling } from '@/lib/billing/stripe';
import { obterSaldoCreditos } from '@/lib/creditos/queries';
import {
  RECURSOS_SUBIDO,
  planoDosMetadados,
  planoTemRecurso,
  recursoPlanoValido,
} from '@/lib/planos/acessos';
import { createClient } from '@/lib/supabase/server';
import { RetornoCheckout } from '../_components/RetornoCheckout';
import { PainelAssinatura } from './PainelAssinatura';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Plano e cobrança' };

export default async function AssinaturaPage({ searchParams }: PageProps<'/conta/assinatura'>) {
  const supabase = await createClient();
  const [{ data }, consulta, catalogo, saldo, parametros] = await Promise.all([
    supabase.auth.getUser(),
    obterAssinaturaAtual(),
    obterCatalogoBilling(),
    obterSaldoCreditos(),
    searchParams,
  ]);
  const plano = planoDosMetadados(data.user?.app_metadata);
  const configuracao = obterConfiguracaoBilling();
  const recurso =
    recursoPlanoValido(parametros.upgrade) && !planoTemRecurso(plano, parametros.upgrade)
      ? RECURSOS_SUBIDO[parametros.upgrade]
      : null;
  const retorno = typeof parametros.checkout === 'string' ? parametros.checkout : undefined;
  const sessao = typeof parametros.session_id === 'string' ? parametros.session_id : undefined;

  return (
    <div className={styles.pagina}>
      <Link href="/conta" className={styles.voltar}>
        <ArrowLeft size={17} aria-hidden="true" />
        Minha conta
      </Link>
      <RetornoCheckout
        key={`${retorno}:${sessao}`}
        retorno={retorno}
        sessao={sessao}
        tipo="assinatura"
      />
      {parametros.portal === 'indisponivel' ? (
        <div className={styles.aviso} role="status">
          Não conseguimos abrir a cobrança. Tente novamente em instantes.
        </div>
      ) : null}
      {recurso ? (
        <div className={styles.avisoUpgrade}>
          <LockKeyhole size={21} aria-hidden="true" />
          <p>
            <strong>{recurso.nome}</strong> está disponível no{' '}
            {recurso.planoMinimo === 'enterprise' ? 'Enterprise' : 'Pro'}.
          </p>
          <a href={`#plano-${recurso.planoMinimo}`}>Ver plano</a>
        </div>
      ) : null}
      <PainelAssinatura
        plano={plano}
        saldo={saldo}
        catalogo={catalogo}
        assinatura={consulta.assinatura}
        indisponivel={consulta.indisponivel}
        creditos={{
          starter: configuracao?.planos.starter.creditos ?? null,
          pro: configuracao?.planos.pro.creditos ?? null,
        }}
      />
    </div>
  );
}

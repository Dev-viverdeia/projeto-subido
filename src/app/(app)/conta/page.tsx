import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Award, Check, Cloud, UserRound } from 'lucide-react';
import { Card } from '@/design-system/via';
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
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <main className={styles.pagina}>
      <CabecalhoPagina titulo="Conta" oculto />

      <section className={styles.hero}>
        <span className={styles.avatar} aria-hidden="true">
          {iniciais || <UserRound size={24} strokeWidth={1.6} />}
        </span>
        <div className={styles.identidade}>
          <p>Conta do profissional</p>
          <h1>{nome}</h1>
          <span>{email}</span>
        </div>
        <span className={styles.sincronizado}>
          <Cloud size={16} strokeWidth={1.8} aria-hidden="true" />
          Progresso sincronizado
        </span>
      </section>

      <div className={styles.grade}>
        <Card variant="default" className={styles.cartao}>
          <header className={styles.cabecalhoCartao}>
            <span>
              <UserRound size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div>
              <p>Identidade</p>
              <h2>Dados de acesso</h2>
            </div>
          </header>
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

        <Card variant="default" className={styles.cartao}>
          <header className={styles.cabecalhoCartao}>
            <span>
              <Cloud size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div>
              <p>Continuidade</p>
              <h2>O que acompanha você</h2>
            </div>
          </header>
          <ul className={styles.recursos}>
            <li>
              <Check size={15} strokeWidth={2.2} aria-hidden="true" />
              Projetos e formações concluídos
            </li>
            <li>
              <Check size={15} strokeWidth={2.2} aria-hidden="true" />
              Contexto do CRM, calls e propostas
            </li>
            <li>
              <Check size={15} strokeWidth={2.2} aria-hidden="true" />
              Conversas e direção do Sobral AI
            </li>
          </ul>
        </Card>
      </div>

      <section className={styles.certificados}>
        <span className={styles.iconeCertificado} aria-hidden="true">
          <Award size={22} strokeWidth={1.6} />
        </span>
        <div>
          <p>Reconhecimento</p>
          <h2>Seus certificados ficam reunidos em uma área própria.</h2>
          <span>Cada conclusão elegível aparece na sua galeria, pronta para consultar.</span>
        </div>
        <Link href="/certificados">
          <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
          Ver certificados
        </Link>
      </section>
    </main>
  );
}

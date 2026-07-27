import type { Metadata } from 'next';
import Link from 'next/link';
import { Boxes, GraduationCap } from 'lucide-react';
import { Card } from '@/design-system/via';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Administração' };

/**
 * Visão geral.
 *
 * As contagens usam `head: true` com `count: 'exact'`: o PostgREST devolve só o
 * total no header, sem trazer nenhuma linha. Um `select('*')` para depois fazer
 * `.length` traria o catálogo inteiro por rede para mostrar um número.
 */
export default async function AdminPage() {
  const supabase = await createClient();

  const [solucoes, formacoes, solucoesPublicadas, formacoesPublicadas] = await Promise.all([
    supabase.from('solucoes').select('*', { count: 'exact', head: true }),
    supabase.from('formacoes').select('*', { count: 'exact', head: true }),
    supabase.from('solucoes').select('*', { count: 'exact', head: true }).eq('status', 'publicado'),
    supabase
      .from('formacoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'publicado'),
  ]);

  const cartoes = [
    {
      href: '/admin/solucoes',
      icone: <Boxes size={18} strokeWidth={1.8} />,
      titulo: 'Soluções',
      total: solucoes.count ?? 0,
      publicadas: solucoesPublicadas.count ?? 0,
    },
    {
      href: '/admin/formacoes',
      icone: <GraduationCap size={18} strokeWidth={1.8} />,
      titulo: 'Formações',
      total: formacoes.count ?? 0,
      publicadas: formacoesPublicadas.count ?? 0,
    },
  ];

  return (
    <>
      <CabecalhoPagina
        titulo="Administração"
        descricao="Cadastre e publique o conteúdo dos pilares. Só quem tem papel de admin chega aqui."
      />

      <div className={styles.grade}>
        {cartoes.map((c) => (
          <Link key={c.href} href={c.href} className={styles.link}>
            <Card variant="default" hoverable className={styles.cartao}>
              <span className={styles.icone} aria-hidden="true">
                {c.icone}
              </span>
              <span className={styles.titulo}>{c.titulo}</span>
              <span className={styles.numero}>{c.total}</span>
              <span className={styles.detalhe}>
                {c.publicadas} {c.publicadas === 1 ? 'publicada' : 'publicadas'}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

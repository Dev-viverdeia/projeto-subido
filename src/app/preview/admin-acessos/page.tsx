import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CreditCard, House, Search, ShieldCheck } from 'lucide-react';
import { PainelContas } from '@/app/(app)/admin/acessos/PainelContas';
import pageStyles from '@/app/(app)/admin/acessos/page.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ContaAdministrada, EventoAcessoAdmin } from '@/lib/admin/acessos';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Acessos e créditos' };

const CONTAS: ContaAdministrada[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    nome: 'Marina Costa',
    email: 'marina@empresa.com.br',
    plano: 'pro',
    saldo: 86,
    ultimoAcessoEm: '2026-08-31T18:00:00.000Z',
    criadaEm: '2026-07-12T18:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    nome: 'Lucas Andrade',
    email: 'lucas@consultoria.com.br',
    plano: 'starter',
    saldo: 18,
    ultimoAcessoEm: '2026-08-29T18:00:00.000Z',
    criadaEm: '2026-08-18T18:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    nome: 'Ana Ribeiro',
    email: 'ana@agencia.com.br',
    plano: 'enterprise',
    saldo: 240,
    ultimoAcessoEm: '2026-08-30T18:00:00.000Z',
    criadaEm: '2026-06-04T18:00:00.000Z',
  },
];

const EVENTOS: EventoAcessoAdmin[] = [];

export default function PreviewAdminAcessosPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <SubidoLogo size={18} />
        </div>
        <nav aria-label="Preview da navegação">
          <span>
            <House size={18} strokeWidth={1.7} aria-hidden="true" /> Início
          </span>
          <span>
            <CreditCard size={18} strokeWidth={1.7} aria-hidden="true" /> Operação
          </span>
          <a className={styles.ativo} href="#conteudo">
            <ShieldCheck size={18} strokeWidth={1.7} aria-hidden="true" /> Administração
          </a>
        </nav>
      </aside>

      <main id="conteudo" className={styles.conteudo}>
        <section className={pageStyles.topo} aria-labelledby="preview-admin-titulo">
          <div className={pageStyles.topoTexto}>
            <p>Administração</p>
            <h1 id="preview-admin-titulo">Acessos e créditos</h1>
            <span>Gerencie o plano e o saldo de cada conta.</span>
          </div>
          <dl className={pageStyles.resumo} aria-label="Resumo das contas">
            <div>
              <dt>Contas</dt>
              <dd>3</dd>
            </div>
            <div>
              <dt>Starter</dt>
              <dd>1</dd>
            </div>
            <div>
              <dt>Pro e Enterprise</dt>
              <dd>2</dd>
            </div>
          </dl>
        </section>

        <section className={pageStyles.consulta} aria-labelledby="preview-busca-titulo">
          <div>
            <h2 id="preview-busca-titulo">Localizar conta</h2>
            <span>Busque por nome ou e-mail.</span>
          </div>
          <form className={pageStyles.busca} role="search">
            <label htmlFor="preview-busca-conta" className="sr-only">
              Buscar por nome ou e-mail
            </label>
            <span aria-hidden="true">
              <Search size={18} strokeWidth={1.8} />
            </span>
            <input id="preview-busca-conta" type="search" placeholder="Nome ou e-mail" />
            <button type="button">Buscar</button>
          </form>
        </section>

        <PainelContas contas={CONTAS} eventos={EVENTOS} busca="" />
      </main>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { listarContasAdmin } from '@/lib/admin/acessos';
import { CabecalhoPagina } from '../../_components/CabecalhoPagina';
import { PainelContas } from './PainelContas';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Acessos e créditos' };

function textoParametro(valor: string | string[] | undefined): string {
  return typeof valor === 'string' ? valor.trim().slice(0, 160) : '';
}

function paginaParametro(valor: string | string[] | undefined): number {
  if (typeof valor !== 'string') return 1;
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) && numero > 0 ? numero : 1;
}

export default async function AcessosAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametros = await searchParams;
  const busca = textoParametro(parametros.busca);
  const paginaPedida = paginaParametro(parametros.pagina);
  const resultado = await listarContasAdmin({ busca, pagina: paginaPedida });
  const starterNaTela = resultado.contas.filter((conta) => conta.plano === 'starter').length;
  const proNaTela = resultado.contas.filter((conta) => conta.plano !== 'starter').length;

  const urlPagina = (pagina: number) => {
    const query = new URLSearchParams();
    if (busca) query.set('busca', busca);
    query.set('pagina', String(pagina));
    return `/admin/acessos?${query.toString()}`;
  };

  return (
    <>
      <CabecalhoPagina titulo="Acessos e créditos" oculto />

      <section className={styles.hero} aria-labelledby="titulo-acessos-admin">
        <div className={styles.heroTexto}>
          <p>
            <SlidersHorizontal size={14} strokeWidth={1.9} aria-hidden="true" />
            Administração de contas
          </p>
          <h1 id="titulo-acessos-admin">Acesso certo, saldo claro.</h1>
          <span>Encontre uma conta, confira o que está liberado e faça uma alteração por vez.</span>
        </div>

        <dl className={styles.resumo} aria-label="Resumo desta página">
          <div>
            <dt>Contas encontradas</dt>
            <dd>{resultado.total}</dd>
          </div>
          <div>
            <dt>Starter nesta página</dt>
            <dd>{starterNaTela}</dd>
          </div>
          <div>
            <dt>Pro nesta página</dt>
            <dd>{proNaTela}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.consulta} aria-labelledby="titulo-busca-conta">
        <div>
          <p className={styles.sobretitulo}>Localizar conta</p>
          <h2 id="titulo-busca-conta">Quem você quer administrar?</h2>
          <span>Busque pelo nome ou e-mail usado para entrar na plataforma.</span>
        </div>

        <form action="/admin/acessos" method="get" className={styles.busca} role="search">
          <label htmlFor="busca-conta-admin" className="sr-only">
            Buscar por nome ou e-mail
          </label>
          <span aria-hidden="true">
            <Search size={18} strokeWidth={1.8} />
          </span>
          <input
            id="busca-conta-admin"
            name="busca"
            type="search"
            defaultValue={busca}
            placeholder="Nome ou e-mail"
            autoComplete="off"
          />
          <button type="submit">Buscar conta</button>
        </form>
      </section>

      <PainelContas contas={resultado.contas} eventos={resultado.eventos} busca={busca} />

      {resultado.paginas > 1 && (
        <nav className={styles.paginacao} aria-label="Páginas de contas">
          {resultado.pagina > 1 ? (
            <Link href={urlPagina(resultado.pagina - 1)}>
              <ArrowLeft size={15} aria-hidden="true" /> Anterior
            </Link>
          ) : (
            <span aria-disabled="true">
              <ArrowLeft size={15} aria-hidden="true" /> Anterior
            </span>
          )}
          <p>
            Página <strong>{resultado.pagina}</strong> de {resultado.paginas}
          </p>
          {resultado.pagina < resultado.paginas ? (
            <Link href={urlPagina(resultado.pagina + 1)}>
              Próxima <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            <span aria-disabled="true">
              Próxima <ArrowRight size={15} aria-hidden="true" />
            </span>
          )}
        </nav>
      )}
    </>
  );
}

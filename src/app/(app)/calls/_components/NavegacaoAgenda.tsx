'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Search, X } from 'lucide-react';
import { hrefAgenda, VISOES_AGENDA, type FiltrosAgenda } from '@/lib/calls/agenda-filtros';
import styles from './NavegacaoAgenda.module.css';

export type NavegacaoAgendaProps = {
  filtros: FiltrosAgenda;
  proximoCursor?: FiltrosAgenda['cursor'];
  base?: string;
};

export function NavegacaoAgenda({
  filtros,
  base = '/reunioes',
  children,
}: NavegacaoAgendaProps & { children: ReactNode }) {
  const router = useRouter();
  const [busca, setBusca] = useState(filtros.busca);
  const [carregando, startTransition] = useTransition();
  return (
    <>
      <div className={styles.controles}>
        <nav aria-label="Listas de reuniões" className={styles.visoes}>
          {VISOES_AGENDA.map((visao) => (
            <Link
              key={visao.id}
              href={hrefAgenda({ visao: visao.id, busca: busca.trim() }, base)}
              aria-current={visao.id === filtros.visao ? 'page' : undefined}
              prefetch={false}
              scroll={false}
              onNavigate={(event) => {
                event.preventDefault();
                startTransition(() =>
                  router.push(hrefAgenda({ visao: visao.id, busca: busca.trim() }, base), {
                    scroll: false,
                  }),
                );
              }}
            >
              {visao.rotulo}
            </Link>
          ))}
        </nav>
        <form
          role="search"
          className={styles.busca}
          action={base}
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(() =>
              router.push(
                hrefAgenda({ visao: filtros.visao, busca: busca.trim().slice(0, 100) }, base),
                { scroll: false },
              ),
            );
          }}
        >
          <input type="hidden" name="visao" value={filtros.visao} />
          <div className={styles.campo}>
            <Search size={19} aria-hidden="true" />
            <input
              name="busca"
              type="search"
              aria-label="Buscar cliente ou reunião"
              placeholder="Buscar cliente ou reunião"
              maxLength={100}
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
            {busca && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setBusca('');
                  startTransition(() =>
                    router.push(hrefAgenda({ visao: filtros.visao, busca: '' }, base), {
                      scroll: false,
                    }),
                  );
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            className="via-btn via-btn--secondary via-btn--md"
            type="submit"
            disabled={carregando}
          >
            {carregando ? 'Buscando…' : 'Buscar'}
          </button>
        </form>
      </div>
      <div className={styles.resultados} aria-busy={carregando}>
        <p className={styles.leitor} role="status">
          {carregando
            ? 'Buscando reuniões…'
            : `Lista de ${VISOES_AGENDA.find((v) => v.id === filtros.visao)?.rotulo.toLowerCase()} atualizada${filtros.busca ? ` para ${filtros.busca}` : ''}.`}
        </p>
        {children}
      </div>
    </>
  );
}

export function PaginacaoAgenda({
  filtros,
  proximoCursor,
  base = '/reunioes',
}: NavegacaoAgendaProps) {
  if (!filtros.cursor && !proximoCursor) return null;
  return (
    <nav className={styles.paginacao} aria-label="Páginas de reuniões">
      {filtros.cursor ? (
        <Link
          className="via-btn via-btn--secondary via-btn--md"
          prefetch={false}
          href={hrefAgenda({ ...filtros, cursor: undefined }, base)}
        >
          Voltar ao início da lista
        </Link>
      ) : (
        <span>12 reuniões por página</span>
      )}
      {proximoCursor && (
        <Link
          className="via-btn via-btn--secondary via-btn--md"
          prefetch={false}
          href={hrefAgenda({ ...filtros, cursor: proximoCursor }, base)}
        >
          Ver mais reuniões <ArrowRight size={17} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}

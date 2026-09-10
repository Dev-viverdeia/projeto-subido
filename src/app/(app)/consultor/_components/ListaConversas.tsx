'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Search, X } from 'lucide-react';
import type { ThreadDoConsultor } from '@/lib/consultor/queries';
import { RenomearConversa } from './RenomearConversa';
import { useBuscaConversas } from './useBuscaConversas';
import styles from './ListaConversas.module.css';

export function ListaConversas({
  threads,
  atualId,
  total = threads.length,
  dono,
}: {
  threads: ThreadDoConsultor[];
  atualId?: string;
  total?: number;
  dono?: string;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState('');
  const historico = useBuscaConversas({ threads, total, mais: total > threads.length }, dono);
  useEffect(() => {
    if (document.activeElement?.getAttribute('role') !== 'tab')
      campo.current?.focus({ preventScroll: true });
  }, []);
  const vazio = !historico.dados.threads.length;
  return (
    <section className={styles.historico} aria-label="Histórico de conversas">
      <div className={styles.busca}>
        <Search size={18} aria-hidden="true" />
        <input
          ref={campo}
          type="search"
          aria-label="Buscar conversa pelo título"
          placeholder="Buscar pelo título"
          maxLength={120}
          value={historico.busca}
          onChange={(e) => {
            setAviso('');
            historico.pesquisar(e.target.value);
          }}
        />
        {historico.busca && (
          <button
            type="button"
            className={styles.icone}
            aria-label="Limpar busca"
            onClick={() => {
              historico.pesquisar('');
              campo.current?.focus();
            }}
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className={styles.resultados} aria-busy={historico.carregando}>
        {historico.carregandoBusca ? (
          <p className={styles.estado} role="status">
            <LoaderCircle size={18} className={styles.girando} aria-hidden="true" />
            Buscando conversas…
          </p>
        ) : historico.erro ? (
          <div className={styles.estado}>
            <p role="alert">{historico.erro}</p>
            <button type="button" onClick={historico.repetir}>
              Tentar novamente
            </button>
          </div>
        ) : vazio ? (
          <div className={styles.estado}>
            <strong>
              {historico.busca ? 'Nenhuma conversa encontrada.' : 'Ainda sem conversas.'}
            </strong>
            <p>
              {historico.busca
                ? 'Tente outra palavra do título.'
                : 'Envie sua primeira pergunta ao Sobral AI.'}
            </p>
          </div>
        ) : (
          <ul className={styles.lista}>
            {historico.dados.threads.map((original) => {
              const t = { ...original, titulo: nomes[original.id] ?? original.titulo };
              return (
                <li key={t.id} className={styles.linha}>
                  <Link
                    href={`/consultor/${t.id}`}
                    className={styles.conversa}
                    aria-current={t.id === atualId ? 'page' : undefined}
                    title={t.titulo}
                  >
                    <span className={styles.titulo}>{t.titulo}</span>
                    <span className={styles.data}>
                      {t.id === atualId ? 'Aberta · ' : ''}
                      {new Intl.DateTimeFormat('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'America/Sao_Paulo',
                      }).format(new Date(t.atualizadoEm))}
                    </span>
                  </Link>
                  {dono && (
                    <RenomearConversa
                      thread={t}
                      dono={dono}
                      aoSalvar={(titulo) => {
                        setNomes((n) => ({ ...n, [t.id]: titulo }));
                        setAviso('Nome salvo.');
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <footer className={styles.rodape}>
        <span role="status">
          {aviso ||
            (historico.busca && !historico.carregando && !historico.erro
              ? `${historico.dados.total} ${historico.dados.total === 1 ? 'conversa' : 'conversas'}`
              : 'Mais recentes')}
        </span>
        {!historico.erro && historico.dados.mais && !historico.carregandoBusca && (
          <button type="button" disabled={historico.carregando} onClick={historico.mais}>
            {historico.carregando ? 'Carregando…' : 'Carregar mais'}
          </button>
        )}
      </footer>
    </section>
  );
}

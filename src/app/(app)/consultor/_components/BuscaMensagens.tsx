'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, LoaderCircle, Search, X } from 'lucide-react';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { useBuscaMensagens } from './useBuscaMensagens';
import { anunciarBuscaMensagem, focarMensagem } from './focarMensagem';
import { TrechoEncontrado } from './TrechoEncontrado';
import compartilhado from './ArquivosConversa.module.css';
import styles from './BuscaMensagens.module.css';

const dataLegivel = (valor: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(valor));

export function BuscaMensagens({ conversa, dono }: { conversa: string; dono: string }) {
  const [aberto, setAberto] = useState(false);
  const [navegando, navegar] = useTransition();
  const router = useRouter();
  const gatilho = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lista = useBuscaMensagens(conversa, dono, aberto);
  function fechar() {
    setAberto(false);
    requestAnimationFrame(() => gatilho.current?.focus({ preventScroll: true }));
  }
  function abrirMensagem(id: string) {
    const termo = lista.busca.trim();
    anunciarBuscaMensagem(conversa, id, termo);
    setAberto(false);
    requestAnimationFrame(() => {
      if (focarMensagem(id, termo)) return;
      navegar(() => router.replace(`/consultor/${conversa}?mensagem=${id}`, { scroll: false }));
    });
  }
  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className={compartilhado.gatilho}
        aria-label="Buscar nesta conversa"
        title="Buscar nesta conversa"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        disabled={navegando}
        onClick={(e) => {
          e.currentTarget.focus({ preventScroll: true });
          lista.reabrir();
          setAberto(true);
        }}
      >
        {navegando ? (
          <LoaderCircle size={18} className={compartilhado.spinner} aria-hidden="true" />
        ) : (
          <Search size={18} aria-hidden="true" />
        )}
        <span>Buscar</span>
      </button>
      <span role="status" className={compartilhado.srOnly}>
        {navegando ? 'Abrindo mensagem…' : ''}
      </span>
      {aberto ? (
        <ModalOperacao open title="Buscar nesta conversa" size="md" onClose={fechar}>
          <div className={compartilhado.busca}>
            <Search size={18} aria-hidden="true" />
            <input
              ref={input}
              data-autofocus
              type="search"
              aria-label="Palavra ou trecho da mensagem"
              autoComplete="off"
              maxLength={120}
              placeholder="Buscar uma palavra ou trecho"
              value={lista.busca}
              onChange={(e) => lista.pesquisar(e.target.value)}
            />
            {lista.busca ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  lista.pesquisar('');
                  input.current?.focus();
                }}
              >
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className={compartilhado.resumo} role="status" aria-live="polite">
            {lista.carregando ? (
              <>
                <LoaderCircle size={16} className={compartilhado.spinner} aria-hidden="true" />{' '}
                Buscando mensagens…
              </>
            ) : lista.resultado ? (
              `${lista.resultado.total} ${lista.resultado.total === 1 ? 'mensagem encontrada' : 'mensagens encontradas'}`
            ) : lista.busca.trim().length === 1 ? (
              'Digite pelo menos 2 caracteres.'
            ) : null}
          </div>
          {lista.erro ? (
            <div className={compartilhado.erro} role="alert">
              <p>{lista.erro}</p>
              <button type="button" onClick={() => lista.repetir()} disabled={lista.carregando}>
                Tentar novamente
              </button>
            </div>
          ) : null}
          <ul
            className={styles.resultados}
            aria-label="Mensagens encontradas"
            aria-busy={lista.carregando}
          >
            {lista.resultado?.mensagens.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={styles.resultado}
                  onClick={() => abrirMensagem(m.id)}
                >
                  <span className={styles.metadados}>
                    <strong>{m.papel === 'usuario' ? 'Você' : 'Sobral AI'}</strong>
                    <time dateTime={m.criadoEm}>{dataLegivel(m.criadoEm)}</time>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </span>
                  <span className={styles.trecho}>
                    <TrechoEncontrado texto={m.trecho} busca={lista.busca} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!lista.carregando &&
          !lista.erro &&
          (!lista.busca.trim() || lista.resultado?.total === 0) ? (
            <div className={compartilhado.vazio}>
              <Search size={32} strokeWidth={1.5} aria-hidden="true" />
              <strong>
                {lista.resultado?.total === 0
                  ? 'Nenhuma mensagem encontrada'
                  : 'Encontre o que já conversaram'}
              </strong>
              <p>
                {lista.resultado?.total === 0
                  ? 'Tente outra palavra ou um trecho menor.'
                  : 'Busque nas suas mensagens e nas respostas do Sobral AI.'}
              </p>
            </div>
          ) : null}
          {lista.resultado?.mais ? (
            <button
              type="button"
              className={compartilhado.mais}
              disabled={lista.carregando || Boolean(lista.erro)}
              onClick={() => lista.mais()}
            >
              Carregar mais resultados
            </button>
          ) : null}
        </ModalOperacao>
      ) : null}
    </>
  );
}

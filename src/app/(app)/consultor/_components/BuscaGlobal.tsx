'use client';
import { useRef } from 'react';
import { ExternalLink, LoaderCircle, Search, X } from 'lucide-react';
import { useBuscaGlobal } from './useBuscaGlobal';
import { TrechoEncontrado } from './TrechoEncontrado';
import h from './ListaConversas.module.css';
import cards from './RespostasSalvas.module.css';
import styles from './BuscaGlobal.module.css';

export function BuscaGlobal({ dono }: { dono: string }) {
  const campo = useRef<HTMLInputElement>(null);
  const lista = useBuscaGlobal(dono);
  const quantidade = lista.resultado?.mensagens.length ?? 0;
  const curto = lista.busca.trim().length < 2;
  return (
    <section className={h.historico} aria-label="Busca em todas as conversas">
      <div className={h.busca}>
        <Search size={18} aria-hidden="true" />
        <input
          ref={campo}
          type="search"
          aria-label="Buscar em todas as conversas"
          placeholder="Palavra ou trecho da conversa"
          autoComplete="off"
          maxLength={120}
          value={lista.busca}
          onChange={(e) => lista.pesquisar(e.target.value)}
        />
        {lista.busca && (
          <button
            type="button"
            className={h.icone}
            aria-label="Limpar busca"
            onClick={() => {
              lista.pesquisar('');
              campo.current?.focus();
            }}
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className={h.resultados} aria-busy={lista.carregando}>
        {lista.carregando && !lista.resultado ? (
          <p className={h.estado} role="status">
            <LoaderCircle size={20} className={cards.girando} aria-hidden="true" />
            Buscando no histórico…
          </p>
        ) : lista.erro ? (
          <div className={h.estado}>
            <p role="alert">{lista.erro}</p>
            <button type="button" onClick={lista.repetir}>
              Tentar novamente
            </button>
          </div>
        ) : curto || quantidade === 0 ? (
          <div className={h.estado}>
            <strong>
              {curto ? 'Encontre uma conversa pelo conteúdo.' : 'Nenhuma mensagem encontrada.'}
            </strong>
            <p>
              {curto
                ? 'Busque nas suas perguntas e nas respostas do Sobral AI.'
                : 'Tente outra palavra ou um trecho menor.'}
            </p>
          </div>
        ) : (
          <ul className={cards.lista} aria-label="Mensagens do histórico">
            {lista.resultado?.mensagens.map((m) => (
              <li key={m.id} className={cards.item}>
                <a
                  className={`${cards.resposta} ${styles.resultado}`}
                  href={`/consultor/${m.conversa}?mensagem=${m.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir mensagem de ${m.titulo} em nova aba`}
                  aria-describedby={`busca-global-trecho-${m.id}`}
                >
                  <span className={cards.origem}>
                    {m.titulo}
                    <ExternalLink size={15} aria-hidden="true" />
                  </span>
                  <p id={`busca-global-trecho-${m.id}`}>
                    <TrechoEncontrado texto={m.trecho} busca={lista.busca} />
                  </p>
                  <span className={styles.metadados}>
                    <span>{m.papel === 'usuario' ? 'Você' : 'Sobral AI'}</span>
                    <time dateTime={m.criadoEm}>
                      {new Intl.DateTimeFormat('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'America/Sao_Paulo',
                      }).format(new Date(m.criadoEm))}
                    </time>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className={`${h.rodape} ${styles.rodape}`}>
        <span role="status">
          {lista.busca.trim().length === 1
            ? 'Digite pelo menos 2 caracteres.'
            : lista.resultado && !lista.carregando && !lista.erro
              ? `${quantidade} ${quantidade === 1 ? 'mensagem' : 'mensagens'}${lista.resultado.mais ? ' · há mais resultados' : ''}`
              : 'Em todas as suas conversas'}
        </span>
        {!lista.erro && lista.resultado?.mais && (
          <button type="button" disabled={lista.carregando} onClick={lista.mais}>
            {lista.carregando ? 'Carregando…' : 'Carregar mais'}
          </button>
        )}
      </footer>
    </section>
  );
}

'use client';
import { useRef, useState } from 'react';
import { Bookmark, ExternalLink, LoaderCircle, Search, X } from 'lucide-react';
import { useRespostasSalvas } from './useRespostasSalvas';
import { SalvarResposta } from './SalvarResposta';
import h from './ListaConversas.module.css';
import styles from './RespostasSalvas.module.css';

export function RespostasSalvas({ dono }: { dono: string }) {
  const campo = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState('');
  const lista = useRespostasSalvas(dono);
  const vazio = lista.resultado?.respostas.length === 0;
  return (
    <section className={h.historico} aria-label="Respostas salvas">
      <div className={h.busca}>
        <Search size={18} aria-hidden="true" />
        <input
          ref={campo}
          type="search"
          aria-label="Buscar nas respostas salvas"
          placeholder="Buscar nas salvas"
          maxLength={120}
          value={lista.busca}
          onChange={(e) => {
            setAviso('');
            lista.pesquisar(e.target.value);
          }}
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
            <LoaderCircle size={20} className={styles.girando} aria-hidden="true" />
            Buscando suas respostas…
          </p>
        ) : lista.erro ? (
          <div className={h.estado}>
            <p role="alert">{lista.erro}</p>
            <button type="button" onClick={lista.repetir}>
              Tentar novamente
            </button>
          </div>
        ) : vazio ? (
          <div className={h.estado}>
            <Bookmark size={24} strokeWidth={1.5} aria-hidden="true" />
            <strong>
              {lista.busca ? 'Nenhuma resposta encontrada.' : 'Guarde o que vale retomar.'}
            </strong>
            <p>
              {lista.busca
                ? 'Tente outra palavra da resposta.'
                : 'Toque em Salvar abaixo de uma resposta do Sobral AI.'}
            </p>
          </div>
        ) : (
          <ul className={styles.lista}>
            {lista.resultado?.respostas.map((r) => (
              <li key={r.id} className={styles.item}>
                <a
                  className={styles.resposta}
                  href={`/consultor/${r.conversa}?mensagem=${r.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir resposta de ${r.titulo} em nova aba`}
                  aria-describedby={`salva-trecho-${r.id}`}
                >
                  <span className={styles.origem}>
                    {r.titulo}
                    <ExternalLink size={15} aria-hidden="true" />
                  </span>
                  <p id={`salva-trecho-${r.id}`}>{r.trecho}</p>
                </a>
                <div className={styles.itemRodape}>
                  <span className={styles.data}>
                    Salva em{' '}
                    {new Intl.DateTimeFormat('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      timeZone: 'America/Sao_Paulo',
                    }).format(new Date(r.salvaEm))}
                  </span>
                  <SalvarResposta
                    mensagem={r.id}
                    dono={dono}
                    salva
                    compacto
                    aoAtualizar={() => {
                      setAviso('Removida das salvas. A conversa continua intacta.');
                      lista.atualizar();
                      campo.current?.focus({ preventScroll: true });
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className={h.rodape}>
        <span role="status">
          {aviso ||
            (lista.resultado && !lista.erro && !lista.carregando
              ? `${lista.resultado.total} ${lista.resultado.total === 1 ? 'resposta salva' : 'respostas salvas'}`
              : 'Só você tem acesso')}
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

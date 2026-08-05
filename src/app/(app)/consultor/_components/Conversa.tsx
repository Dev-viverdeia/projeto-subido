'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ArrowUp } from 'lucide-react';
import { enviarMensagem } from '@/lib/consultor/invocar';
import styles from './Conversa.module.css';

const MAXIMO = 8000;

/**
 * O lado interativo da conversa — campo, envio e a rodada em curso.
 *
 * O HISTÓRICO É DO SERVIDOR. As mensagens gravadas chegam por RSC (children da
 * página); este componente só cuida da RODADA em voo: mostra a pergunta recém-
 * enviada e o "escrevendo" do consultor até o `router.refresh()` trazer a
 * conversa regravada do banco — aí o estado local zera e a fonte volta a ser
 * uma só. É o mesmo desenho do Builder: o banco conta a história.
 *
 * Numa conversa NOVA (sem thread), a resposta traz o id e a navegação leva para
 * /consultor/[id] — a URL vira o estado, como no Builder.
 */
export function Conversa({ threadId }: { threadId?: string }) {
  const router = useRouter();
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState('');
  const [emVoo, setEmVoo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [navegando, iniciarNavegacao] = useTransition();

  const ocupado = emVoo !== null || navegando;

  /* A rodada em voo entra no fim da lista; rolar até ela é o que diz "foi". */
  useEffect(() => {
    if (emVoo) fimRef.current?.scrollIntoView({ block: 'end' });
  }, [emVoo]);

  async function enviar() {
    const mensagem = texto.trim();
    if (!mensagem || ocupado) return;

    setEmVoo(mensagem);
    setErro(null);
    setTexto('');

    const { dados, falha } = await enviarMensagem(mensagem, threadId);

    if (falha) {
      setErro(falha.mensagem);
      setEmVoo(null);
      setTexto(mensagem);
      return;
    }

    if (!threadId) {
      iniciarNavegacao(() => router.push(`/consultor/${dados.thread_id}`));
      return;
    }

    /* O refresh trai a conversa regravada; o estado local sai DEPOIS que o
       servidor respondeu, para a pergunta não piscar fora da tela. */
    iniciarNavegacao(() => {
      router.refresh();
      setEmVoo(null);
    });
  }

  return (
    <div className={styles.conversa}>
      {emVoo !== null && (
        <div className={styles.rodadaEmVoo} ref={fimRef}>
          <p className={`${styles.balao} ${styles.doUsuario}`}>{emVoo}</p>
          <p className={styles.escrevendo} role="status">
            <span className={styles.ponto} aria-hidden="true" />
            consultor escrevendo
          </p>
        </div>
      )}

      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}

      <form
        className={styles.caixa}
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <label className="sr-only" htmlFor="mensagem-consultor">
          Sua pergunta para o consultor
        </label>
        <textarea
          id="mensagem-consultor"
          ref={campoRef}
          className={styles.campo}
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAXIMO))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void enviar();
            }
          }}
          disabled={ocupado}
          rows={3}
          placeholder="Ex.: meu cliente quer automatizar o pós-venda, por onde eu começo?"
        />
        <button
          type="submit"
          className={styles.enviar}
          disabled={!texto.trim() || ocupado}
          aria-label={ocupado ? 'Aguardando resposta' : 'Enviar mensagem'}
        >
          <ArrowUp size={17} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

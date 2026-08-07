'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ArrowUp } from 'lucide-react';
import { enviarMensagem, responderPendente } from '@/lib/consultor/invocar';
import { criarConversa } from '@/lib/consultor/criar';
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
export type ExemploDoConsultor = {
  /** O que aparece no chip — rótulo curto. */
  rotulo: string;
  /** O que entra no campo — a pergunta completa, pronta para editar. */
  texto: string;
};

export function Conversa({
  threadId,
  pendente = false,
  exemplos,
}: {
  threadId?: string;
  /** A última mensagem gravada é do usuário e ainda não tem resposta — a
      conversa acabou de nascer no browser e o consultor deve responder JÁ. */
  pendente?: boolean;
  exemplos?: ExemploDoConsultor[];
}) {
  const router = useRouter();
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState('');
  const [emVoo, setEmVoo] = useState<string | null>(null);
  const [digitando, setDigitando] = useState(pendente);
  const [erro, setErro] = useState<string | null>(null);
  const [navegando, iniciarNavegacao] = useTransition();
  const fimAncora = useRef<HTMLDivElement>(null);

  const ocupado = emVoo !== null || digitando || navegando;

  /* A rodada em voo entra no fim da lista; rolar até ela é o que diz "foi". */
  useEffect(() => {
    if (emVoo) fimRef.current?.scrollIntoView({ block: 'end' });
  }, [emVoo]);

  /* A PENDÊNCIA DISPARA NA CHEGADA: a página navegou para cá com a pergunta
     já gravada; esta é a metade lenta, rodando dentro do chat — que é onde a
     espera pertence. Idempotente do lado da função: aba duplicada não paga
     duas rodadas. */
  useEffect(() => {
    if (!pendente || !threadId) return;
    let ativo = true;
    void (async () => {
      const { falha } = await responderPendente(threadId);
      if (!ativo) return;
      if (falha) {
        setErro(falha.mensagem);
        setDigitando(false);
        return;
      }
      iniciarNavegacao(() => {
        router.refresh();
        setDigitando(false);
      });
    })();
    return () => {
      ativo = false;
    };
    /* Roda uma vez por montagem da conversa pendente. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* CONVERSA ABRE NO FIM — chat lê de baixo. `instant`: é posição inicial,
     não movimento; animar a chegada seria teatro. Roda a cada remonte, e a
     página remonta quando o refresh traz mensagens novas. */
  useEffect(() => {
    if (threadId) fimAncora.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, [threadId]);

  /* O campo CRESCE com o texto, como o compositor do Builder — `auto` antes de
     ler o scrollHeight, senão a altura anterior vira piso e ele nunca encolhe. */
  useEffect(() => {
    const campo = campoRef.current;
    if (!campo) return;
    campo.style.height = 'auto';
    campo.style.height = `${Math.min(campo.scrollHeight, 220)}px`;
  }, [texto]);

  async function enviar() {
    const mensagem = texto.trim();
    if (!mensagem || ocupado) return;

    setErro(null);

    /* CONVERSA NOVA: grava pergunta + thread pelo browser (milissegundos) e
       NAVEGA — a resposta acontece dentro do chat, onde a espera pertence. */
    if (!threadId) {
      setEmVoo(mensagem);
      const { threadId: novo, falha } = await criarConversa(mensagem);
      if (falha) {
        setErro(falha);
        setEmVoo(null);
        return;
      }
      iniciarNavegacao(() => router.push(`/consultor/${novo}`));
      return;
    }

    setEmVoo(mensagem);
    setTexto('');

    const { falha } = await enviarMensagem(mensagem, threadId);

    if (falha) {
      setErro(falha.mensagem);
      setEmVoo(null);
      setTexto(mensagem);
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
      <div ref={fimAncora} aria-hidden="true" />
      {(emVoo !== null || digitando) && (
        <div className={styles.rodadaEmVoo} ref={fimRef}>
          {emVoo !== null && <p className={`${styles.balao} ${styles.doUsuario}`}>{emVoo}</p>}
          {/* A bolha de digitação — o idioma universal de chat, com os três
              pontos em compasso. `role=status` + rótulo para leitor de tela. */}
          <div className={styles.digitando} role="status" aria-label="Sobral AI escrevendo">
            <span className={styles.pontinho} aria-hidden="true" />
            <span className={styles.pontinho} aria-hidden="true" />
            <span className={styles.pontinho} aria-hidden="true" />
          </div>
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
            /* Chat: Enter ENVIA, Shift+Enter quebra linha — a convenção que a
               mão já conhece. O Compositor do Builder faz o inverso porque lá
               o texto é um briefing longo; aqui é conversa. */
            if (e.key === 'Enter' && !e.shiftKey) {
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

      {/* Os exemplos ensinam o que é uma boa pergunta — mesmo papel dos chips
          do Builder: ponto de partida para editar, não formulário pronto. */}
      {exemplos && exemplos.length > 0 && (
        <section className={styles.exemplos}>
          <h3 className={styles.divisor}>
            <span>ou comece por um exemplo</span>
          </h3>
          <ul className={styles.chips}>
            {exemplos.map((e) => (
              <li key={e.rotulo}>
                <button
                  type="button"
                  className={styles.chip}
                  disabled={ocupado}
                  onClick={() => {
                    setTexto(e.texto);
                    const campo = campoRef.current;
                    if (campo) {
                      campo.focus();
                      requestAnimationFrame(() =>
                        campo.setSelectionRange(e.texto.length, e.texto.length),
                      );
                    }
                  }}
                >
                  {e.rotulo}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

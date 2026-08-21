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
 * Numa conversa nova, a thread nasce em segundo plano e continua no mesmo chat
 * da Início. A URL deixa de ser estado: o histórico mais recente é carregado
 * pelo servidor a cada atualização.
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
  ultimaMensagemId,
  exemplos,
}: {
  threadId?: string;
  /** A última mensagem gravada é do usuário e ainda não tem resposta — a
      conversa acabou de nascer no browser e o consultor deve responder JÁ. */
  pendente?: boolean;
  /** Identifica a versão do histórico que chegou do servidor. */
  ultimaMensagemId?: string;
  exemplos?: ExemploDoConsultor[];
}) {
  const router = useRouter();
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState('');
  const [threadEmUso, setThreadEmUso] = useState(threadId);
  const [threadPendente, setThreadPendente] = useState(pendente);
  const [emVoo, setEmVoo] = useState<string | null>(null);
  const [respostaEmVoo, setRespostaEmVoo] = useState<string | null>(null);
  const [digitando, setDigitando] = useState(pendente);
  const [erro, setErro] = useState<string | null>(null);
  const [navegando, iniciarNavegacao] = useTransition();
  const fimAncora = useRef<HTMLDivElement>(null);
  const versaoDoHistorico = useRef(ultimaMensagemId);

  const ocupado = emVoo !== null || digitando || navegando;

  /* A rodada em voo entra no fim da lista; rolar até ela é o que diz "foi". */
  useEffect(() => {
    if (emVoo || respostaEmVoo) fimRef.current?.scrollIntoView({ block: 'end' });
  }, [emVoo, respostaEmVoo]);

  /* A API já devolve a resposta completa. Ela permanece visível até o RSC
     confirmar uma nova mensagem no histórico, evitando o clarão vazio que
     fazia a conversa parecer travada depois do carregamento. */
  useEffect(() => {
    if (!ultimaMensagemId || ultimaMensagemId === versaoDoHistorico.current) return;
    versaoDoHistorico.current = ultimaMensagemId;
    setEmVoo(null);
    setRespostaEmVoo(null);
    setDigitando(false);
  }, [ultimaMensagemId]);

  /* A PENDÊNCIA DISPARA NA CHEGADA: a página navegou para cá com a pergunta
     já gravada; esta é a metade lenta, rodando dentro do chat — que é onde a
     espera pertence. Idempotente do lado da função: aba duplicada não paga
     duas rodadas. */
  useEffect(() => {
    if (!pendente || !threadId) return;
    let ativo = true;
    void (async () => {
      const { dados, falha } = await responderPendente(threadId);
      if (!ativo) return;
      if (falha) {
        setErro(falha.mensagem);
        setDigitando(false);
        setThreadPendente(true);
        return;
      }
      setRespostaEmVoo(dados.resposta);
      setDigitando(false);
      iniciarNavegacao(() => {
        router.refresh();
        setThreadPendente(false);
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
    if (threadEmUso) fimAncora.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, [threadEmUso]);

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
    setRespostaEmVoo(null);

    /* CONVERSA NOVA: grava pergunta + thread pelo browser e responde sem tirar
       o usuário da Início. */
    if (!threadEmUso) {
      setEmVoo(mensagem);
      setTexto('');
      const { threadId: novo, falha } = await criarConversa(mensagem);
      if (falha || !novo) {
        setErro(falha ?? 'Não foi possível iniciar a conversa.');
        setEmVoo(null);
        setTexto(mensagem);
        return;
      }
      setThreadEmUso(novo);
      setThreadPendente(true);
      setDigitando(true);
      const { dados: dadosResposta, falha: falhaResposta } = await responderPendente(novo);
      if (falhaResposta) {
        setErro(falhaResposta.mensagem);
        setEmVoo(null);
        setDigitando(false);
        setTexto(mensagem);
        return;
      }
      setRespostaEmVoo(dadosResposta.resposta);
      setEmVoo(null);
      setDigitando(false);
      iniciarNavegacao(() => {
        router.refresh();
        setThreadPendente(false);
      });
      return;
    }

    setEmVoo(mensagem);
    setTexto('');
    setDigitando(true);

    const { dados, falha } = threadPendente
      ? await responderPendente(threadEmUso)
      : await enviarMensagem(mensagem, threadEmUso);

    if (falha) {
      setErro(falha.mensagem);
      setEmVoo(null);
      setDigitando(false);
      setTexto(mensagem);
      return;
    }

    setRespostaEmVoo(dados.resposta);
    setEmVoo(null);
    setDigitando(false);

    /* O refresh trai a conversa regravada; o estado local sai DEPOIS que o
       servidor respondeu, para a pergunta não piscar fora da tela. */
    iniciarNavegacao(() => {
      router.refresh();
      setThreadPendente(false);
    });
  }

  return (
    <div className={styles.conversa}>
      <div ref={fimAncora} aria-hidden="true" />
      {(emVoo !== null || digitando || respostaEmVoo !== null) && (
        <div className={styles.rodadaEmVoo} ref={fimRef}>
          {emVoo !== null && <p className={`${styles.balao} ${styles.doUsuario}`}>{emVoo}</p>}
          {/* A bolha de digitação — o idioma universal de chat, com os três
              pontos em compasso. `role=status` + rótulo para leitor de tela. */}
          {digitando && (
            <div className={styles.digitando} role="status" aria-label="Sobral AI escrevendo">
              <span className={styles.digitandoRotulo}>Sobral AI está preparando a resposta</span>
              <span className={styles.pontosDigitando} aria-hidden="true">
                <span className={styles.pontinho} />
                <span className={styles.pontinho} />
                <span className={styles.pontinho} />
              </span>
            </div>
          )}
          {respostaEmVoo !== null && (
            <p className={`${styles.balao} ${styles.doConsultor}`}>{respostaEmVoo}</p>
          )}
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

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { pedirGeracao } from '@/lib/builder/invocar';
import type { RespostaClarificacao } from '@/lib/builder/schema';
import styles from './Entrevista.module.css';

const LIMITE = 2000;

/**
 * A entrevista — UMA PERGUNTA POR VEZ.
 *
 * O QUE MUDOU E POR QUÊ. Antes as cinco perguntas vinham numa lista só, com um
 * `textarea` de duas linhas cada. A lista é honesta e é o formato errado para
 * este momento: cinco campos abertos ao mesmo tempo leem como formulário de
 * cadastro, e a pessoa varre tudo procurando o mais fácil em vez de responder. Um
 * campo por tela devolve o peso de cada pergunta — e o campo grande convida a
 * escrever, que é exatamente o que a geração precisa.
 *
 * NENHUMA RESPOSTA É OBRIGATÓRIA, e isso sobrevive à mudança. Travar o avanço até
 * o campo ter texto é a forma mais rápida de fazer alguém escrever "não sei" cinco
 * vezes — resposta pior que campo vazio, porque entra no prompt como se fosse
 * informação. "Próxima pergunta" está sempre habilitada.
 *
 * "VOLTAR" SÓ APARECE A PARTIR DA SEGUNDA. Na primeira ele não teria destino
 * dentro da entrevista, e um botão que não faz nada ensina a ignorar os que
 * fazem. Para sair existe o X, que é outra intenção.
 *
 * AS RESPOSTAS VIVEM NA MEMÓRIA ATÉ A GERAÇÃO — igual à versão anterior. As
 * PERGUNTAS vêm do banco, então o rascunho é retomável; as respostas ainda não
 * são. Com uma pergunta por vez isso pesa mais que antes (a pessoa pode estar na
 * quinta), e é dívida assumida, não esquecida: gravar a cada avanço precisa de uma
 * Server Action própria, que não entra junto com a mudança de layout.
 */
export function Entrevista({
  id,
  ideia,
  perguntas,
}: {
  id: string;
  ideia: string;
  perguntas: RespostaClarificacao[];
}) {
  const router = useRouter();
  const [respostas, setRespostas] = useState(perguntas);
  const [atual, setAtual] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);

  const item = respostas[atual];
  const ultima = atual === respostas.length - 1;

  /* O foco acompanha a pergunta. Sem isto, avançar deixaria o foco no botão e
     quem usa teclado teria de tabular de volta ao campo a cada pergunta. */
  useEffect(() => {
    campoRef.current?.focus();
  }, [atual]);

  if (!item) return null;

  function responder(valor: string) {
    setRespostas((lista) =>
      lista.map((r, i) => (i === atual ? { ...r, resposta: valor.slice(0, LIMITE) } : r)),
    );
  }

  async function gerar() {
    if (enviando) return;
    setEnviando(true);
    setErro(null);

    const { falha } = await pedirGeracao(id, respostas);

    if (falha) {
      setErro(falha.mensagem);
      setEnviando(false);
      return;
    }

    /* `refresh()` e não `push()`: a URL já é a certa. O servidor re-renderiza com
       status `gerando` e o `EstadoGeracao` assume a espera. `enviando` não é
       zerado — este formulário está de saída. */
    router.refresh();
  }

  return (
    <div className={styles.entrevista}>
      <header className={styles.topo}>
        <p className={styles.ideia}>
          <span className={styles.ideiaRotulo}>Sua ideia:</span> {ideia}
        </p>

        <div className={styles.topoDireita}>
          {/* Caixa-alta por CONTEÚDO: precisa do tracking de eyebrow mesmo sem
              `text-transform`, porque a necessidade vem da forma das letras. */}
          <p className={styles.contador} aria-live="polite">
            Pergunta {atual + 1} de {respostas.length}
          </p>
          <button
            type="button"
            className={styles.sair}
            onClick={() => router.push('/builder')}
            aria-label="Sair da entrevista e voltar aos projetos"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="m4 4 8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.trilho} aria-hidden="true">
        <span
          className={styles.preenchido}
          style={{ transform: `scaleX(${(atual + 1) / respostas.length})` }}
        />
      </div>

      <div className={styles.corpo}>
        <label className={styles.pergunta} htmlFor="resposta">
          {item.pergunta}
        </label>

        {/* O `porque` não está na referência, e fica: é dado que o modelo produziu
            explicando o que aquela pergunta muda no projeto. Subordinado ao
            enunciado, nunca competindo com ele. */}
        {item.porque && <p className={styles.porque}>{item.porque}</p>}

        <div className={styles.campoCaixa}>
          <textarea
            id="resposta"
            ref={campoRef}
            className={styles.campo}
            value={item.resposta}
            maxLength={LIMITE}
            onChange={(e) => responder(e.target.value)}
            placeholder="Escreva o que souber. Pode deixar em branco."
          />
          <p className={styles.limite}>
            {item.resposta.length} / {LIMITE}
          </p>
        </div>
      </div>

      <footer className={styles.rodape}>
        {/* Só a partir da segunda — na primeira não há destino. */}
        {atual > 0 ? (
          <button type="button" className={styles.voltar} onClick={() => setAtual(atual - 1)}>
            Voltar
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          className={styles.avancar}
          disabled={enviando}
          onClick={() => (ultima ? void gerar() : setAtual(atual + 1))}
        >
          {ultima ? (enviando ? 'Iniciando…' : 'Gerar o projeto') : 'Próxima pergunta'}
        </button>
      </footer>

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

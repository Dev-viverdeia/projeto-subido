'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './Compositor.module.css';

const MINIMO = 20;
const MAXIMO = 2000;

/**
 * O campo da ideia — a única entrada do Builder.
 *
 * TEXTAREA PRÓPRIA, NÃO `Input` DO DS
 * O DS não tem textarea, e o `Input` é uma linha. A ideia de um cliente não cabe
 * numa linha, e um campo de uma linha ensina a escrever pouco — o que produz
 * projeto raso. O tamanho do campo É a instrução.
 *
 * SEM CHAVE, O BOTÃO NEM APARECE
 * `temChave` chega do servidor. Sem ela, o campo fica desabilitado e a tela diz o
 * que falta — em vez de aceitar a ideia, girar um spinner e falhar no fim.
 */
export function Compositor({ temChave }: { temChave: boolean }) {
  const router = useRouter();
  const [ideia, setIdeia] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [navegando, iniciarNavegacao] = useTransition();

  const curta = ideia.trim().length < MINIMO;
  /* `enviando` cobre a chamada; `navegando` cobre a transição de rota depois
     dela. Sem o segundo, o botão volta ao normal por uns instantes enquanto a
     próxima tela carrega — e o campo parece ter perdido o clique. */
  const ocupado = enviando || navegando;

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (curta || ocupado) return;

    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch('/api/builder/perguntas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ideia: ideia.trim() }),
      });

      const corpo: unknown = await resposta.json();

      if (!resposta.ok) {
        const mensagem =
          typeof corpo === 'object' && corpo !== null && 'erro' in corpo
            ? String(corpo.erro)
            : 'Não foi possível continuar. Tente de novo.';
        setErro(mensagem);
        return;
      }

      const { id } = corpo as { id: string };
      iniciarNavegacao(() => router.push(`/builder/${id}`));
    } catch {
      setErro('A conexão caiu no meio. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      className={styles.compositor}
      onSubmit={(evento) => {
        void enviar(evento);
      }}
    >
      <div className={styles.sheen} aria-hidden="true" />

      <p className={styles.eyebrow}>Builder</p>
      <h2 className={styles.titulo}>Descreva a ideia do cliente.</h2>
      <p className={styles.apoio}>
        O Builder pergunta o que falta para projetar e devolve o projeto inteiro: arquitetura,
        ferramentas, passo a passo, prompts, riscos e a conta da economia.
      </p>

      <label className={styles.rotulo} htmlFor="ideia-do-cliente">
        A ideia, com o contexto que você já tem
      </label>
      {/* Placeholder curto por MEDIDA: a 375px o campo mostra 4 linhas, e o
          exemplo anterior ocupava 8 — era cortado no meio de uma palavra.
          Exemplo cortado ensina pior que exemplo curto. */}
      <textarea
        id="ideia-do-cliente"
        className={styles.campo}
        value={ideia}
        onChange={(evento) => setIdeia(evento.target.value.slice(0, MAXIMO))}
        disabled={!temChave || ocupado}
        rows={5}
        placeholder="Ex.: clínica que perde agendamento no WhatsApp fora do horário e quer marcar consulta sozinha."
        aria-describedby="ideia-contador"
      />

      <div className={styles.rodape}>
        <p className={styles.contador} id="ideia-contador">
          <span className={styles.numero}>{ideia.trim().length}</span>
          <span className={styles.barra}>/</span>
          {MAXIMO}
          {curta ? <span className={styles.dica}> · mínimo {MINIMO}</span> : null}
        </p>

        <button type="submit" className={styles.acao} disabled={!temChave || curta || ocupado}>
          {ocupado ? 'Lendo a ideia…' : 'Formular o projeto'}
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}

      {!temChave ? (
        <p className={styles.pendencia}>
          O Builder está sem chave de modelo configurada (<code>ANTHROPIC_API_KEY</code>). Enquanto
          ela não entrar no ambiente, a geração não roda — e nada aqui vai inventar uma solução para
          preencher a tela.
        </p>
      ) : null}
    </form>
  );
}

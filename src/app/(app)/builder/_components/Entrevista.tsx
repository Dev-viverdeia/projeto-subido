'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { RespostaClarificacao } from '@/lib/builder/schema';
import styles from './Entrevista.module.css';

/**
 * A entrevista — passo 2 de 2.
 *
 * As perguntas vêm do banco (foram gravadas junto do rascunho), não de um estado
 * que sobreviveu à navegação. É o que torna o rascunho retomável: recarregar,
 * fechar a aba, abrir no outro computador — as mesmas perguntas.
 *
 * NENHUMA RESPOSTA É OBRIGATÓRIA, E ISSO É DELIBERADO.
 * Travar o botão até tudo estar preenchido é a forma mais rápida de fazer alguém
 * escrever "não sei" cinco vezes — resposta pior que campo vazio, porque entra no
 * prompt como se fosse informação. O que falta é DITO, com número, e a decisão
 * fica com quem conhece o cliente.
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
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [segundos, setSegundos] = useState(0);

  const respondidas = respostas.filter((r) => r.resposta.trim().length > 0).length;
  const vazias = respostas.length - respondidas;

  /* Cronômetro da espera. A geração leva dezenas de segundos e um spinner sem
     número não diz se está andando ou travado — o tempo decorrido diz. */
  useEffect(() => {
    if (!gerando) return;
    const timer = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [gerando]);

  function responder(indice: number, valor: string) {
    setRespostas((atual) =>
      atual.map((r, i) => (i === indice ? { ...r, resposta: valor.slice(0, 2000) } : r)),
    );
  }

  async function gerar(evento: React.FormEvent) {
    evento.preventDefault();
    if (gerando) return;

    setGerando(true);
    setSegundos(0);
    setErro(null);

    try {
      const resposta = await fetch('/api/builder/gerar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, respostas }),
      });

      const corpo: unknown = await resposta.json();

      if (!resposta.ok) {
        setErro(
          typeof corpo === 'object' && corpo !== null && 'erro' in corpo
            ? String(corpo.erro)
            : 'A geração falhou. Tente de novo.',
        );
        setGerando(false);
        return;
      }

      /* `refresh()` e não `push()`: a URL já é a certa. O servidor re-renderiza a
         mesma rota, agora com status `pronta`, e a ficha entra no lugar do
         formulário sem uma navegação que a pessoa não pediu. */
      router.refresh();
    } catch {
      setErro('A conexão caiu no meio. O projeto pode ter sido gerado — recarregue a página.');
      setGerando(false);
    }
  }

  if (gerando) {
    return (
      <div className={styles.espera} role="status" aria-live="polite">
        <div className={styles.pulso} aria-hidden="true" />
        <h2 className={styles.esperaTitulo}>Escrevendo o projeto.</h2>
        <p className={styles.esperaTexto}>
          Arquitetura, ferramentas, passo a passo, prompts, riscos e a conta da economia. Leva de um
          a três minutos — a aba pode ficar aberta.
        </p>
        <p className={styles.cronometro}>
          <span className={styles.relogio}>{String(segundos).padStart(3, '0')}</span>s
        </p>
      </div>
    );
  }

  return (
    <form
      className={styles.entrevista}
      onSubmit={(evento) => {
        void gerar(evento);
      }}
    >
      <div className={styles.contexto}>
        <p className={styles.contextoRotulo}>A ideia</p>
        <p className={styles.contextoTexto}>{ideia}</p>
      </div>

      <div className={styles.cabecalho}>
        <h2 className={styles.titulo}>O que falta para projetar</h2>
        <p className={styles.subtitulo}>
          Cada resposta muda a arquitetura. O que você não souber, deixe em branco — em branco é
          melhor que chute.
        </p>
      </div>

      <ol className={styles.lista}>
        {respostas.map((item, indice) => (
          <li key={item.pergunta} className={styles.item}>
            <span className={styles.numero}>{String(indice + 1).padStart(2, '0')}</span>

            <div className={styles.corpo}>
              <label className={styles.pergunta} htmlFor={`pergunta-${indice}`}>
                {item.pergunta}
              </label>
              <p className={styles.porque}>{item.porque}</p>
              <textarea
                id={`pergunta-${indice}`}
                className={styles.campo}
                rows={2}
                value={item.resposta}
                onChange={(evento) => responder(indice, evento.target.value)}
                placeholder="Sua resposta"
              />
            </div>
          </li>
        ))}
      </ol>

      <div className={styles.rodape}>
        <p className={styles.progresso}>
          <span className={styles.contagem}>{respondidas}</span> de{' '}
          <span className={styles.contagem}>{respostas.length}</span> respondidas
          {vazias > 0 ? (
            <span className={styles.aviso}> · o projeto sai com menos precisão</span>
          ) : null}
        </p>

        <button type="submit" className={styles.acao}>
          Gerar o projeto
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
    </form>
  );
}

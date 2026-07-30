'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { pedirGeracao } from '@/lib/builder/invocar';
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
 *
 * ESTE COMPONENTE NÃO TEM MAIS TELA DE ESPERA, e a razão é arquitetural. A Edge
 * Function aceita o pedido e responde em milissegundos: quem gera é uma tarefa de
 * fundo, e quem conta a espera é o `EstadoGeracao`, que lê o status do banco.
 * Manter aqui um segundo cronômetro seria duas telas de espera para a mesma
 * espera — e elas divergiriam no primeiro reload.
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
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const respondidas = respostas.filter((r) => r.resposta.trim().length > 0).length;
  const vazias = respostas.length - respondidas;

  function responder(indice: number, valor: string) {
    setRespostas((atual) =>
      atual.map((r, i) => (i === indice ? { ...r, resposta: valor.slice(0, 2000) } : r)),
    );
  }

  async function gerar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setErro(null);

    const { falha } = await pedirGeracao(id, respostas);

    if (falha) {
      setErro(falha.mensagem);
      setEnviando(false);
      return;
    }

    /* `refresh()` e não `push()`: a URL já é a certa. O servidor re-renderiza a
       mesma rota, agora com status `gerando`, e o `EstadoGeracao` assume a espera.
       `enviando` não é zerado — este formulário está de saída. */
    router.refresh();
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
          Cada resposta muda a arquitetura. Deixe em branco o que não souber: lacuna atrapalha menos
          que chute.
        </p>
      </div>

      {/* `data-respondida` é a única pista de PROGRESSO dentro da lista. Sem ela o
          rodapé dizia "1 de 3 respondidas" e o olho não achava QUAL — três cards
          idênticos. A distinção é por cor sólida no número, não por ícone: a lista
          é de texto, e um check seria o único glifo da tela. */}
      <ol className={styles.lista}>
        {respostas.map((item, indice) => (
          <li
            key={item.pergunta}
            className={styles.item}
            data-respondida={item.resposta.trim().length > 0 ? '' : undefined}
          >
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

        <button type="submit" className={styles.acao} disabled={enviando}>
          {enviando ? 'Iniciando…' : 'Gerar o projeto'}
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

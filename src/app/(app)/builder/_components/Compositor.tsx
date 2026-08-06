'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';
import { ArrowUp } from 'lucide-react';
import { pedirPerguntas } from '@/lib/builder/invocar';
import { PainelEspera } from './PainelEspera';
import { EXEMPLOS } from './exemplos';
import styles from './Compositor.module.css';

const MINIMO = 20;
const MAXIMO = 4000;

/**
 * O compositor — a tela inicial do Builder.
 *
 * COMPOSIÇÃO CENTRADA E CLARA, e a versão anterior errava justamente nisso.
 * Ela era uma banda navy de largura total com o texto encostado à esquerda: peso
 * de seção de landing numa tela cuja única função é receber uma frase. Aqui a
 * página inteira É o campo, então a hierarquia certa é editorial e centrada —
 * pergunta, campo, exemplos — com a superfície clara que o resto da plataforma
 * usa. Sem banda escura nenhuma: o accent não é legível sobre claro, e nesta
 * tela ele não tem o que destacar.
 *
 * OS EXEMPLOS NÃO SÃO DECORAÇÃO. Campo em branco com limite de 4000 caracteres
 * não diz o que é uma boa descrição. Cada chip preenche o campo com um briefing
 * real — volume, quem opera, o que já existe —, que é exatamente o que a
 * entrevista do passo seguinte vai perguntar se faltar.
 *
 * A CHAVE NÃO É MAIS CONFERIDA AQUI, e é uma perda assumida. Enquanto a geração
 * morava na Vercel, o servidor lia `process.env` e desabilitava o campo ANTES de
 * aceitar a ideia. Agora o segredo vive nos secrets do Supabase, fora do alcance
 * do Next: o campo fica sempre habilitado e a ausência aparece na primeira
 * chamada, como erro com o nome do secret. É o preço direto de mover a geração
 * para a Edge Function.
 */
export function Compositor() {
  const router = useRouter();
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const [ideia, setIdeia] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [navegando, iniciarNavegacao] = useTransition();

  const curta = ideia.trim().length < MINIMO;
  /* `enviando` cobre a chamada; `navegando` cobre a transição de rota depois
     dela. Sem o segundo, o botão volta ao normal por uns instantes enquanto a
     próxima tela carrega — e o campo parece ter perdido o clique. */
  const ocupado = enviando || navegando;
  const bloqueado = curta || ocupado;

  const atalho = useTeclaDeComando();

  /**
   * O CAMPO CRESCE COM O TEXTO. Medido a 375px com um dos exemplos dentro: com
   * altura fixa o texto rolava por baixo do rodapé e a última linha visível
   * ficava cortada ao meio — parecia defeito de renderização, não conteúdo
   * rolando. Crescendo até o teto, o briefing típico cabe inteiro e o corte só
   * acontece em texto muito longo, onde rolar já é esperado.
   *
   * `height: auto` antes de ler `scrollHeight` é obrigatório: sem isso a altura
   * anterior vira o piso da medição e o campo só cresce, nunca encolhe. Os
   * limites vivem no CSS (`min-height`/`max-height`), que ganham do inline.
   */
  useEffect(() => {
    const campo = campoRef.current;
    if (!campo) return;
    campo.style.height = 'auto';
    campo.style.height = `${campo.scrollHeight}px`;
  }, [ideia]);

  async function enviar() {
    if (bloqueado) return;

    setEnviando(true);
    setErro(null);

    const { dados, falha } = await pedirPerguntas(ideia.trim());

    if (falha) {
      setErro(falha.mensagem);
      setEnviando(false);
      return;
    }

    /* `setEnviando(false)` NÃO acontece no caminho feliz: a navegação começa
       aqui e o componente sai da tela. Zerar o estado antes disso devolveria o
       botão ao normal por um instante, e o clique pareceria perdido. */
    iniciarNavegacao(() => router.push(`/builder/${dados.id}`));
  }

  function usarExemplo(texto: string) {
    setIdeia(texto);
    /* Foca e leva o cursor para o fim: o exemplo é ponto de partida para editar,
       não formulário para enviar como veio. */
    const campo = campoRef.current;
    if (campo) {
      campo.focus();
      requestAnimationFrame(() => campo.setSelectionRange(texto.length, texto.length));
    }
  }

  /* Os passos da ANÁLISE — as fases da chamada que escreve as perguntas. Elas
     acontecem de verdade; o que a lista faz é narrar o que está em curso em vez
     de deixar a pessoa olhando para um botão desabilitado. Ver `PainelEspera`. */
  if (ocupado) {
    return (
      <PainelEspera
        rotulo="Análise"
        ideia={ideia}
        passos={[
          'Lendo a sua ideia',
          'Mapeando o que você já definiu',
          'Escrevendo perguntas sobre o seu projeto',
        ]}
        /* A análise leva ~10–25s: fases mais curtas que as da geração. */
        intervalo={6000}
      />
    );
  }

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <p className={styles.eyebrow}>Builder</p>
        <h2 className={styles.titulo}>
          O que o seu cliente precisa <em>resolver</em>?
        </h2>
        {/* As duas frases têm comprimento parecido de propósito: com `balance` e a
            medida em 46ch, a quebra cai no ponto final em vez de deixar uma
            palavra órfã abrindo a segunda linha. */}
        <p className={styles.apoio}>
          Descreva o problema como o cliente te contou.{' '}
          <em>O projeto de implementação é o que volta.</em>
        </p>
      </header>

      <form
        className={styles.caixa}
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviar();
        }}
      >
        <label className="sr-only" htmlFor="ideia-do-cliente">
          O problema do cliente, com o contexto que você já tem
        </label>
        <textarea
          id="ideia-do-cliente"
          ref={campoRef}
          className={styles.campo}
          value={ideia}
          onChange={(evento) => setIdeia(evento.target.value.slice(0, MAXIMO))}
          onKeyDown={(evento) => {
            /* ⌘/Ctrl + Enter envia; Enter sozinho continua quebrando linha. Num
               campo de briefing, Enter-para-enviar corta a frase no meio. */
            if (evento.key === 'Enter' && (evento.metaKey || evento.ctrlKey)) {
              evento.preventDefault();
              void enviar();
            }
          }}
          disabled={ocupado}
          rows={6}
          placeholder="Ex.: meu cliente tem uma clínica e perde agendamento porque ninguém responde o WhatsApp fora do horário comercial. Ele queria que isso funcionasse sozinho, sem sair do sistema que a recepção já usa…"
        />

        <div className={styles.rodape}>
          <p className={styles.contador} aria-hidden="true">
            <span className={styles.escrito}>{ideia.trim().length}</span>
            <span className={styles.barra}>/</span>
            {MAXIMO}
          </p>

          <div className={styles.acoes}>
            <span className={styles.atalho} aria-hidden="true">
              {atalho} Enter
            </span>
            <button
              type="submit"
              className={styles.enviar}
              disabled={bloqueado}
              aria-label={ocupado ? 'Lendo a ideia' : 'Formular o projeto'}
            >
              <ArrowUp size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      {erro ? (
        <p className={styles.aviso} role="alert">
          {erro}
        </p>
      ) : null}

      <section className={styles.exemplos}>
        <h3 className={styles.divisor}>
          <span>ou comece por um exemplo</span>
        </h3>

        <ul className={styles.chips}>
          {EXEMPLOS.map((exemplo) => (
            <li key={exemplo.rotulo}>
              <button
                type="button"
                className={styles.chip}
                onClick={() => usarExemplo(exemplo.texto)}
                disabled={ocupado}
              >
                {exemplo.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * `⌘` no Mac, `Ctrl` no resto — e isso só se sabe no cliente.
 *
 * `useSyncExternalStore` com snapshot de servidor é o padrão da casa para valor
 * que o servidor não tem: o HTML sai com "Ctrl", a hidratação bate, e o React
 * troca depois sem warning. `useEffect` + `setState` faria o mesmo com um passo
 * a mais e sem a garantia de consistência.
 */
function useTeclaDeComando(): string {
  const inscrever = useCallback(() => () => {}, []);
  return useSyncExternalStore(
    inscrever,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl'),
    () => 'Ctrl',
  );
}

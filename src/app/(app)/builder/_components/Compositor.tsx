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
import { pedirPerguntas } from '@/lib/builder/invocar';
import { EXEMPLOS } from './exemplos';
import styles from './Compositor.module.css';

const MINIMO = 20;
const MAXIMO = 4000;

/**
 * O compositor — a tela inicial do Builder.
 *
 * COMPOSIÇÃO EDITORIAL E OPERACIONAL. O cabeçalho apresenta o resultado, o campo
 * recebe o contexto e os exemplos ensinam a qualidade esperada sem competir com
 * a ação principal.
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

  return (
    <div className={styles.tela}>
      <section className={styles.introducao} aria-labelledby="builder-titulo">
        <header className={styles.cabecalho}>
          <p className={styles.eyebrow}>Builder de projetos</p>
          <h2 className={styles.titulo} id="builder-titulo">
            Do problema ao plano de implementação.
          </h2>
          <p className={styles.apoio}>
            Descreva o cenário como o cliente contou. O Builder identifica as lacunas e estrutura um
            projeto pronto para executar.
          </p>
        </header>

        <ol className={styles.etapas}>
          <li className={styles.etapaFluxo}>
            <span className={styles.numero}>01</span>
            <div>
              <h3>Descreva o contexto</h3>
              <p>Explique o problema, quem opera e o que já existe.</p>
            </div>
          </li>
          <li className={styles.etapaFluxo}>
            <span className={styles.numero}>02</span>
            <div>
              <h3>Complete as lacunas</h3>
              <p>Responda apenas o que souber na entrevista seguinte.</p>
            </div>
          </li>
          <li className={styles.etapaFluxo}>
            <span className={styles.numero}>03</span>
            <div>
              <h3>Receba o projeto</h3>
              <p>Arquitetura, ferramentas, etapas, prompts, riscos e economia.</p>
            </div>
          </li>
        </ol>
      </section>

      <div className={styles.estacao}>
        <form
          className={styles.caixa}
          onSubmit={(evento) => {
            evento.preventDefault();
            void enviar();
          }}
        >
          <div className={styles.campoCabecalho}>
            <label className={styles.rotuloCampo} htmlFor="ideia-do-cliente">
              Contexto do cliente
            </label>
            <span className={styles.indiceEtapa}>Etapa 1 de 2</span>
          </div>

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
            rows={7}
            placeholder="Ex.: uma clínica perde agendamentos porque ninguém responde o WhatsApp fora do horário. A recepção usa um sistema próprio, recebe cerca de 80 contatos por dia e precisa manter o atendimento humano nos casos mais complexos…"
          />

          <div className={styles.rodape}>
            <p className={styles.contador} aria-hidden="true">
              <span className={styles.escrito}>{ideia.trim().length}</span>
              <span className={styles.barra}>/</span>
              {MAXIMO}
              <span className={styles.minimo}>mín. {MINIMO}</span>
            </p>

            <div className={styles.acoes}>
              <span className={styles.atalho} aria-hidden="true">
                {atalho} Enter
              </span>
              <button
                type="submit"
                className={styles.enviar}
                disabled={bloqueado}
                aria-label={ocupado ? 'Analisando o contexto' : 'Analisar o contexto'}
              >
                {ocupado ? 'Analisando…' : 'Analisar contexto'}
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
          <h3 className={styles.divisor}>Comece por um exemplo</h3>

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

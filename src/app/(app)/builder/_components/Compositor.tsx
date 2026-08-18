'use client';

import Link from 'next/link';
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
import styles from './Compositor.module.css';

const MINIMO = 20;
const MAXIMO = 3200;

/**
 * O compositor — a tela inicial do Builder.
 *
 * O ponto de partida combina uma entrega que a pessoa já sabe implementar com o
 * contexto real de um cliente. A personalização fica limitada ao que muda, e o
 * vínculo comercial segue junto até a proposta.
 *
 * A CHAVE NÃO É MAIS CONFERIDA AQUI, e é uma perda assumida. Enquanto a geração
 * morava na Vercel, o servidor lia `process.env` e desabilitava o campo ANTES de
 * aceitar a ideia. Agora o segredo vive nos secrets do Supabase, fora do alcance
 * do Next: o campo fica sempre habilitado e a ausência aparece na primeira
 * chamada, como erro com o nome do secret. É o preço direto de mover a geração
 * para a Edge Function.
 */
export type ProjetoBaseEstudio = {
  id: string;
  slug: string;
  titulo: string;
  resumo: string;
  resultado: string;
};

export type OportunidadeEstudio = {
  id: string;
  titulo: string;
  empresa: string;
  contato: string | null;
};

export function Compositor({
  projetosBase = [],
  oportunidades = [],
  projetoInicialId = '',
  oportunidadeInicialId = '',
}: {
  projetosBase?: ProjetoBaseEstudio[];
  oportunidades?: OportunidadeEstudio[];
  projetoInicialId?: string;
  oportunidadeInicialId?: string;
}) {
  const router = useRouter();
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const [ideia, setIdeia] = useState('');
  const [projetoBaseId, setProjetoBaseId] = useState(projetoInicialId);
  const [oportunidadeId, setOportunidadeId] = useState(oportunidadeInicialId);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [navegando, iniciarNavegacao] = useTransition();

  const projetoBase = projetosBase.find((item) => item.id === projetoBaseId) ?? null;
  const oportunidade = oportunidades.find((item) => item.id === oportunidadeId) ?? null;
  const curta = ideia.trim().length < MINIMO;
  /* `enviando` cobre a chamada; `navegando` cobre a transição de rota depois
     dela. Sem o segundo, o botão volta ao normal por uns instantes enquanto a
     próxima tela carrega — e o campo parece ter perdido o clique. */
  const ocupado = enviando || navegando;
  const bloqueado = curta || !projetoBase || ocupado;

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
    if (bloqueado || !projetoBase) return;

    setEnviando(true);
    setErro(null);

    const briefing = [
      `Projeto-base: ${projetoBase.titulo}.`,
      `Resultado padrão: ${projetoBase.resultado}`,
      oportunidade
        ? `Cliente: ${oportunidade.empresa}. Oportunidade no CRM: ${oportunidade.titulo}.`
        : null,
      `Contexto real e mudanças pedidas pelo cliente: ${ideia.trim()}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    const { dados, falha } = await pedirPerguntas(briefing, {
      projetoBase: projetoBase.id,
      oportunidade: oportunidade?.id,
    });

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

  /* Os passos da ANÁLISE — as fases da chamada que escreve as perguntas. Elas
     acontecem de verdade; o que a lista faz é narrar o que está em curso em vez
     de deixar a pessoa olhando para um botão desabilitado. Ver `PainelEspera`. */
  if (ocupado) {
    return (
      <PainelEspera
        rotulo="Análise"
        ideia={ideia}
        passos={['Lendo o briefing', 'Separando o que já foi definido', 'Preparando as perguntas']}
        /* A análise leva ~10–25s: fases mais curtas que as da geração. */
        intervalo={6000}
      />
    );
  }

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <p className={styles.eyebrow}>
          {projetoBase ? 'Estúdio · Adaptação de projeto' : 'Estúdio'}
        </p>
        <h2 className={styles.titulo}>
          {projetoBase ? (
            <>
              O que precisa mudar <em>para este cliente</em>?
            </>
          ) : (
            <>
              Qual problema o cliente precisa <em>resolver</em>?
            </>
          )}
        </h2>
        {/* As duas frases têm comprimento parecido de propósito: com `balance` e a
            medida em 46ch, a quebra cai no ponto final em vez de deixar uma
            palavra órfã abrindo a segunda linha. */}
        <p className={styles.apoio}>
          {projetoBase ? (
            <>Use o projeto padrão como base e explique o que este cliente precisa de diferente.</>
          ) : (
            <>Conte como o trabalho funciona hoje, onde o problema aparece e o que precisa mudar.</>
          )}
        </p>
      </header>

      <ol className={styles.fluxoEstudio} aria-label="Fluxo de criação do projeto">
        <li data-ativo="true">
          <span>01</span>
          <strong>Cliente</strong>
        </li>
        <li>
          <span>02</span>
          <strong>Entrevista</strong>
        </li>
        <li>
          <span>03</span>
          <strong>Projeto</strong>
        </li>
        <li>
          <span>04</span>
          <strong>Proposta</strong>
        </li>
      </ol>

      <div className={styles.mesaCriacao}>
        <aside className={styles.retorno} aria-labelledby="retorno-estudio" data-on-dark>
          <p className={styles.retornoEyebrow}>O que você recebe</p>
          <h3 id="retorno-estudio">Um projeto para revisar, apresentar e implementar.</h3>
          <ol className={styles.entregas}>
            <li>
              <span>01</span>
              <div>
                <strong>Escopo e arquitetura</strong>
                <p>O que será construído, em qual ordem e o que fica de fora.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Kit de implementação</strong>
                <p>Ferramentas, prompts, riscos e formas de testar a entrega.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Base para a proposta</strong>
                <p>O escopo fica pronto para entrar na proposta comercial.</p>
              </div>
            </li>
          </ol>
          <p className={styles.retornoNota}>Você revisa e adapta tudo antes de apresentar.</p>
        </aside>

        <div className={styles.briefing}>
          <section className={styles.partida} aria-labelledby="partida-estudio">
            <header>
              <span>Antes de gerar</span>
              <strong id="partida-estudio">Escolha o projeto e o cliente</strong>
            </header>

            <div className={styles.decisaoGrid}>
              <label className={styles.decisao}>
                <span>01 · Projeto-base</span>
                <select
                  value={projetoBaseId}
                  onChange={(evento) => setProjetoBaseId(evento.target.value)}
                  disabled={ocupado}
                  required
                >
                  <option value="" disabled>
                    Escolha um dos cinco Projetos
                  </option>
                  {projetosBase.map((projeto) => (
                    <option value={projeto.id} key={projeto.id}>
                      {projeto.titulo}
                    </option>
                  ))}
                </select>
                <small>
                  {projetoBase
                    ? projetoBase.resultado
                    : 'O Estúdio usa esse passo a passo como base.'}
                </small>
              </label>

              <label className={styles.decisao}>
                <span>02 · Cliente do CRM</span>
                <select
                  value={oportunidadeId}
                  onChange={(evento) => setOportunidadeId(evento.target.value)}
                  disabled={ocupado || oportunidades.length === 0}
                >
                  <option value="">
                    {oportunidades.length ? 'Escolher depois' : 'Nenhum cliente disponível'}
                  </option>
                  {oportunidades.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.empresa} · {item.titulo}
                    </option>
                  ))}
                </select>
                <small>
                  {oportunidade
                    ? `O projeto e a proposta ficarão ligados a ${oportunidade.empresa}.`
                    : oportunidades.length
                      ? 'Opcional agora. Você poderá escolher o cliente ao criar a proposta.'
                      : 'Nenhuma oportunidade aberta no CRM.'}
                </small>
              </label>
            </div>

            {oportunidades.length === 0 ? (
              <Link href="/crm?novo=projeto" className={styles.atalhoCrm}>
                Cadastrar cliente no CRM
              </Link>
            ) : null}
          </section>

          <form
            className={styles.caixa}
            onSubmit={(evento) => {
              evento.preventDefault();
              void enviar();
            }}
          >
            <label className="sr-only" htmlFor="ideia-do-cliente">
              O problema do cliente e o que você já sabe
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
              placeholder="Conte o que o cliente relatou, como o trabalho funciona hoje, onde o problema aparece e o que precisa continuar igual."
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
        </div>
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

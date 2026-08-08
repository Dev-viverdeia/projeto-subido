'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import type { ItemSolucao } from '@/lib/conteudo/queries';
import { estadoDoProgresso, useProgresso } from '@/lib/progresso/local';
import { AbasFiltro, type Aba } from '../../_components/filtros/AbasFiltro';
import { Ferramentas, Prompts } from './KitSolucao';
import { PassoAPasso, idDaEtapa } from './PassoAPasso';
import { PillEstado } from '../../_components/PillEstado';
import { TrilhoProgresso } from '../../_components/TrilhoProgresso';
import styles from './FichaSolucao.module.css';

/**
 * A ficha de implantação — cabeçalho, abas, passo a passo e coluna de apoio.
 *
 * POR QUE UMA ILHA SÓ, e não quatro. Três pedaços da tela derivam do MESMO fato
 * ("qual é a etapa atual"): o selo do cabeçalho, a frase do trilho de progresso e
 * a etapa aberta na timeline. Espalhados em ilhas separadas, cada um recalcularia
 * a regra por conta própria e elas divergiriam na primeira mudança. Aqui a regra
 * é uma linha, calculada uma vez e distribuída.
 *
 * O QUE VEM DO SERVIDOR CHEGA PRONTO. `icone`, `video` e `proxima` são
 * `ReactNode` renderizados pelo Server Component: é o padrão do `navegacao.tsx` —
 * passar a REFERÊNCIA do componente faria todo consumidor cliente importar
 * `lucide` inteiro para poder chamá-la.
 *
 * NÃO É "ZERO JS", e a diferença foi medida: em `lucide-react@1.27.0` o
 * `dist/esm/Icon.mjs` abre com `"use client"`. Renderizar `<Boxes />` no servidor
 * NÃO produz SVG inline no payload — produz uma referência de cliente para `Icon`
 * (1,8 KB de fonte) com os traços do ícone viajando como prop. O que o padrão
 * economiza é o resto: a fábrica e os outros ícones do módulo importado. A regra
 * continua valendo; o número que a acompanhava, não.
 *
 * AS ABAS TROCAM A COLUNA PRINCIPAL, e essa foi uma decisão sobre o mockup, não
 * uma omissão dele. O desenho original trazia ferramentas e prompts nas abas E na
 * coluna de apoio ao mesmo tempo — o mesmo conteúdo duas vezes na mesma dobra.
 * Aqui as abas são o conteúdo e a coluna de apoio guarda o que é orientação:
 * onde você está e para onde vai depois.
 *
 * Aba só existe quando TEM conteúdo, e a tira some quando sobra uma só: uma aba
 * solitária sublinhada é um rótulo fingindo ser controle.
 */
type Chave = 'etapas' | 'ferramentas' | 'prompts';

export function FichaSolucao({
  slug,
  titulo,
  resumo,
  categoria,
  etapas,
  ferramentas,
  prompts,
  icone,
  video,
  proxima,
}: {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string | null;
  etapas: ItemSolucao[];
  ferramentas: ItemSolucao[];
  prompts: ItemSolucao[];
  icone: ReactNode;
  video: ReactNode;
  proxima: ReactNode;
}) {
  const progresso = useProgresso();
  const reduzir = useReducedMotion();

  const abas = useMemo<Aba[]>(() => {
    const lista: Aba[] = [];
    if (etapas.length > 0) lista.push({ id: 'etapas', rotulo: 'Passo a passo' });
    if (ferramentas.length > 0) lista.push({ id: 'ferramentas', rotulo: 'Ferramentas' });
    if (prompts.length > 0) lista.push({ id: 'prompts', rotulo: 'Prompts' });
    return lista;
  }, [etapas.length, ferramentas.length, prompts.length]);

  const primeira = (abas[0]?.id ?? 'etapas') as Chave;
  const [aba, setAba] = useState<Chave>(primeira);

  /* A REGRA, num lugar só: a etapa atual é a primeira não marcada.
     O conjunto, e não só a contagem — a barra segmentada precisa saber QUAIS,
     porque marcar etapa alterna e pode acontecer fora de ordem. */
  const feitasIds = new Set(etapas.filter((e) => progresso.etapas[e.id]).map((e) => e.id));
  const etapaAtual = etapas.find((e) => !feitasIds.has(e.id)) ?? null;
  const estado = estadoDoProgresso(feitasIds.size, etapas.length);

  /**
   * "Continuar" rola até a etapa atual — e o caminho depende de a aba já ser a
   * certa ou não.
   *
   * Estando nela, o elemento existe e a rolagem é imediata. Vindo de outra aba, o
   * painel do passo a passo AINDA NÃO FOI MONTADO no instante do clique: o alvo
   * fica pendurado numa REF e o efeito o consome quando a aba troca.
   *
   * Ref e não estado, de propósito: guardar o alvo em `useState` obrigaria a
   * limpá-lo com `setAlvo(null)` dentro do próprio efeito — cascata de render que
   * o `react-hooks/set-state-in-effect` reprova, e com razão. A ref não participa
   * do render, então zerá-la não custa ciclo nenhum.
   */
  const pendente = useRef<string | null>(null);

  const rolarAte = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' });
    /* O foco acompanha — "Continuar" tem que levar junto quem navega por teclado,
       não só quem enxerga a rolagem. `preventScroll` evita o segundo salto. */
    el?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const id = pendente.current;
    if (!id) return;
    pendente.current = null;
    rolarAte(id);
    /* `rolarAte` é recriada a cada render e não pode entrar nas dependências sem
       arrastar um `useCallback` só para isto; o que dispara é a troca de aba. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  const continuar = () => {
    if (!etapaAtual) return;
    const id = idDaEtapa(etapaAtual.id);

    if (aba === 'etapas') {
      rolarAte(id);
      return;
    }

    pendente.current = id;
    setAba('etapas');
  };

  /* Só entra o que EXISTE — contagem zero não vira "0 ferramentas". */
  const metas = [
    etapas.length > 0 && `${etapas.length} ${etapas.length === 1 ? 'etapa' : 'etapas'}`,
    ferramentas.length > 0 &&
      `${ferramentas.length} ${ferramentas.length === 1 ? 'ferramenta' : 'ferramentas'}`,
    prompts.length > 0 && `${prompts.length} ${prompts.length === 1 ? 'prompt' : 'prompts'}`,
  ].filter((v): v is string => Boolean(v));

  /* Sem tira de abas não há `tabpanel`: o papel aponta para um `aria-labelledby`
     que não existiria no documento, e uma referência ARIA quebrada é pior que
     nenhum papel — o leitor de tela anuncia um painel sem nome. */
  const comAbas = abas.length > 1;

  const painel = (chave: Chave, conteudo: ReactNode) =>
    aba === chave ? (
      <div
        id={comAbas ? `ficha-painel-${chave}` : undefined}
        role={comAbas ? 'tabpanel' : undefined}
        aria-labelledby={comAbas ? `ficha-aba-${chave}` : undefined}
        /* O painel de Ferramentas não tem UM elemento focável dentro: sem
           `tabIndex`, quem navega por teclado passa da tira de abas direto para a
           coluna de apoio e nunca alcança o conteúdo que acabou de selecionar. */
        tabIndex={comAbas ? 0 : undefined}
      >
        {conteudo}
      </div>
    ) : null;

  return (
    <div className={styles.grade}>
      <div className={styles.principal}>
        <header className={styles.cabecalho}>
          <div className={styles.identidade}>
            <span className={styles.glifo} aria-hidden="true">
              {icone}
            </span>
            {categoria && <p className={styles.eyebrow}>{categoria}</p>}
            <PillEstado estado={estado} className={styles.selo} />
          </div>

          <h1 className={styles.titulo}>{titulo}</h1>
          {resumo && <p className={styles.resumo}>{resumo}</p>}

          {metas.length > 0 && (
            <ul className={styles.metas}>
              {metas.map((m) => (
                <li key={m} className={styles.meta}>
                  {m}
                </li>
              ))}
            </ul>
          )}
        </header>

        {/* SEM ETAPAS NÃO HÁ ABA "Passo a passo" — e o vídeo mora dentro dela.
            Uma solução que só tem ferramentas e prompts perdia a gravação inteira,
            silenciosamente: o nó chegava do servidor e nunca era montado. Aqui ele
            sobe para o topo da coluna, que é onde ele já estaria se esta tela não
            tivesse abas. */}
        {etapas.length === 0 && video}

        {comAbas && (
          <div className={styles.tira}>
            <AbasFiltro
              abas={abas}
              ativa={aba}
              aoMudar={(id) => setAba(id as Chave)}
              layoutId="ficha-solucao"
              ariaLabel="Seções do projeto"
              prefixoId="ficha"
            />
          </div>
        )}

        {painel(
          'etapas',
          <div className={styles.pilha}>
            {/* O vídeo é a gravação DA IMPLANTAÇÃO: mora com o passo a passo, e
                some quando a aba muda porque não é capa da página. */}
            {video}
            <PassoAPasso
              etapas={etapas}
              slug={slug}
              etapaAtualId={etapaAtual ? etapaAtual.id : null}
            />
          </div>,
        )}

        {painel('ferramentas', <Ferramentas itens={ferramentas} />)}
        {painel('prompts', <Prompts itens={prompts} />)}
      </div>

      <aside className={styles.apoio}>
        <TrilhoProgresso
          itens={etapas}
          feitasIds={feitasIds}
          proximo={etapaAtual}
          unidade={{ singular: 'etapa', plural: 'etapas' }}
          aoContinuar={continuar}
          notaFinal="Salvo na sua conta para continuar em qualquer dispositivo."
        />
        {proxima}
      </aside>
    </div>
  );
}

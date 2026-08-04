'use client';

import { useMemo, useState } from 'react';
import { TRILHAS } from '@/lib/mentorias/tipos';
import type { TrilhaMentor } from '@/lib/mentorias/tipos';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import type { EstadoMentoria } from './estadoMentoria';
import { chaveDoDia, horaCurta } from './estadoMentoria';
import styles from './CalendarioMentorias.module.css';

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

type Celula = { chave: string; dia: number; iso: string; doMes: boolean; hoje: boolean };

/** Seis semanas SEMPRE — cinco faria a grade mudar de altura ao trocar de mês. */
function montarGrade(ano: number, mes: number, agora: Date): Celula[] {
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(primeiro);
  inicio.setDate(1 - primeiro.getDay());
  const chaveHoje = chaveDoDia(agora.toISOString());

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    const iso = d.toISOString();
    const chave = chaveDoDia(iso);
    return { chave, dia: d.getDate(), iso, doMes: d.getMonth() === mes, hoje: chave === chaveHoje };
  });
}

function IconeSeta({ direcao }: { direcao: 'anterior' | 'proximo' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direcao === 'anterior' ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Vista de CALENDÁRIO: grade do mês à esquerda, dia escolhido à direita.
 *
 * ALINHAMENTO — as duas CAIXAS alinham entre si.
 * O painel é uma superfície com borda; a grade de células também. Antes o painel
 * começava no topo do TÍTULO do mês, 67px acima da grade, e as duas caixas ficavam
 * desencontradas. A correção é estrutural, não uma margem chutada: `.raiz` tem TRÊS
 * linhas (cabeçalho · dias da semana · células) e o painel mora na terceira, ao lado
 * das células. Assim o alinhamento sobrevive a mudar o tamanho do título ou a
 * altura da linha de dias da semana — margem fixa não sobreviveria.
 *
 * A GRADE precisa de área (7 colunas fixas que só engordam a célula), a LISTA do
 * dia precisa de medida. É a regra de largura da casa com as duas naturezas na
 * mesma tela.
 *
 * A célula mostra no máximo DUAS sessões e um "+N": empilhar todas faria as linhas
 * terem alturas diferentes conforme o mês, e grade que muda de altura ao navegar é
 * o que mais denuncia calendário improvisado.
 */
export function CalendarioMentorias({
  sessoes,
  agora,
  estadoDaSessao,
  aoAbrirDetalhe,
}: {
  /** TODAS as sessões, inclusive encerradas: navegar para trás tem que mostrar o passado. */
  sessoes: SessaoMentoria[];
  agora: Date;
  estadoDaSessao: (s: SessaoMentoria) => EstadoMentoria;
  aoAbrirDetalhe: (id: string) => void;
}) {
  const [ref, setRef] = useState({ ano: agora.getFullYear(), mes: agora.getMonth() });
  const [selecionado, setSelecionado] = useState<string>(chaveDoDia(agora.toISOString()));

  const porDia = useMemo(() => {
    const mapa = new Map<string, SessaoMentoria[]>();
    for (const s of sessoes) {
      const chave = chaveDoDia(s.inicioIso);
      mapa.set(chave, [...(mapa.get(chave) ?? []), s]);
    }
    for (const lista of mapa.values()) lista.sort((a, b) => a.inicioIso.localeCompare(b.inicioIso));
    return mapa;
  }, [sessoes]);

  const grade = useMemo(() => montarGrade(ref.ano, ref.mes, agora), [ref, agora]);

  const nomeMes = new Date(ref.ano, ref.mes, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  /* Memoizado porque entra na dependência do `proximaDepois`: `?? []` cria um
     array novo a cada render e invalidaria o memo de baixo sempre. */
  const doDia = useMemo(() => porDia.get(selecionado) ?? [], [porDia, selecionado]);
  const dataSelecionada = grade.find((c) => c.chave === selecionado);

  /* Dia vazio não é beco sem saída: aponta a próxima sessão DEPOIS dele. É a
     diferença entre "não tem nada" e "não tem aqui, tem ali". */
  const proximaDepois = useMemo(() => {
    if (doDia.length > 0 || !dataSelecionada) return null;
    const limite = new Date(dataSelecionada.iso);
    limite.setHours(23, 59, 59, 999);
    return (
      sessoes
        .filter((s) => new Date(s.inicioIso).getTime() > limite.getTime())
        .sort((a, b) => a.inicioIso.localeCompare(b.inicioIso))[0] ?? null
    );
  }, [doDia, dataSelecionada, sessoes]);

  /* Quantas sessões cada trilha tem no mês VISÍVEL. Alimenta a legenda, que
     existe porque a célula codifica a trilha em COR — e cor sem legenda é
     charada. (O comentário antigo dizia que a célula mostrava siglas; ela nunca
     mostrou. Mostrava as iniciais do MENTOR, que é outra coisa e não informava
     nada.) E resolve, com informação de verdade, a calha morta que sobrava sob o
     painel do dia. */
  const porTrilhaNoMes = useMemo(() => {
    const conta = new Map<TrilhaMentor, number>();
    for (const s of sessoes) {
      const d = new Date(s.inicioIso);
      if (d.getFullYear() !== ref.ano || d.getMonth() !== ref.mes) continue;
      const t = s.mentor?.trilha;
      if (t) conta.set(t, (conta.get(t) ?? 0) + 1);
    }
    return conta;
  }, [sessoes, ref]);

  const andar = (passo: number) => {
    const d = new Date(ref.ano, ref.mes + passo, 1);
    setRef({ ano: d.getFullYear(), mes: d.getMonth() });
  };

  const voltarParaHoje = () => {
    setRef({ ano: agora.getFullYear(), mes: agora.getMonth() });
    setSelecionado(chaveDoDia(agora.toISOString()));
  };

  const noMesAtual = ref.ano === agora.getFullYear() && ref.mes === agora.getMonth();
  const dataObj = dataSelecionada ? new Date(dataSelecionada.iso) : null;

  const irPara = (s: SessaoMentoria) => {
    const d = new Date(s.inicioIso);
    setRef({ ano: d.getFullYear(), mes: d.getMonth() });
    setSelecionado(chaveDoDia(s.inicioIso));
  };

  return (
    <div className={styles.raiz}>
      <header className={styles.cabecalho}>
        <h3 className={styles.mes}>{nomeMes}</h3>
        <div className={styles.navegacao}>
          {!noMesAtual && (
            <button type="button" className={styles.hoje} onClick={voltarParaHoje}>
              Hoje
            </button>
          )}
          <button
            type="button"
            className={styles.seta}
            onClick={() => andar(-1)}
            aria-label="Mês anterior"
          >
            <IconeSeta direcao="anterior" />
          </button>
          <button
            type="button"
            className={styles.seta}
            onClick={() => andar(1)}
            aria-label="Próximo mês"
          >
            <IconeSeta direcao="proximo" />
          </button>
        </div>
      </header>

      <div className={styles.semana} aria-hidden="true">
        {SEMANA.map((d) => (
          <span key={d} className={styles.diaSemana}>
            {d}
          </span>
        ))}
      </div>

      <div className={styles.celulas} role="grid" aria-label={`Sessões de ${nomeMes}`}>
        {grade.map((c) => {
          const lista = porDia.get(c.chave) ?? [];
          const aoVivo = lista.some((s) => estadoDaSessao(s) === 'ao-vivo');
          return (
            <button
              key={c.chave}
              type="button"
              role="gridcell"
              className={styles.celula}
              data-fora={!c.doMes ? '' : undefined}
              data-hoje={c.hoje ? '' : undefined}
              data-sel={c.chave === selecionado ? '' : undefined}
              aria-selected={c.chave === selecionado}
              onClick={() => setSelecionado(c.chave)}
            >
              <span className={styles.topo}>
                <span className={styles.numero}>{c.dia}</span>
                {aoVivo && <span className={styles.pontoVivo} aria-hidden="true" />}
              </span>

              <span className={styles.marcas}>
                {lista.slice(0, 2).map((s) => (
                  /* HORA + TÍTULO. Antes eram hora + iniciais do mentor, e as
                     iniciais não dizem nada aqui: numa agenda com um time só,
                     toda célula do mês virava "ES". O que a pessoa procura ao
                     bater o olho no mês é DO QUE é a sessão — a trilha já está
                     dita pela cor da barra à esquerda, que a legenda mapeia. */
                  <span key={s.id} className={styles.marca} data-trilha={s.mentor?.trilha}>
                    <span className={styles.marcaHora}>{horaCurta(s.inicioIso)}</span>
                    <span className={styles.marcaTitulo}>{s.titulo}</span>
                  </span>
                ))}
                {lista.length > 2 && <span className={styles.mais}>+{lista.length - 2} mais</span>}
              </span>
            </button>
          );
        })}
      </div>

      <aside className={styles.coluna}>
        <div className={styles.painel} aria-live="polite">
          {/* Carimbo de data: o número é o protagonista, como num calendário de mesa. */}
          <div className={styles.carimbo}>
            <span className={styles.carimboDia}>{dataObj?.getDate()}</span>
            <span className={styles.carimboTextos}>
              <span className={styles.carimboSemana}>
                {dataObj?.toLocaleDateString('pt-BR', { weekday: 'long' })}
              </span>
              <span className={styles.carimboMes}>
                {dataObj?.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </span>
          </div>

          <p className={styles.contagem}>
            {doDia.length === 0
              ? 'sem mentoria'
              : `${doDia.length} ${doDia.length === 1 ? 'mentoria' : 'mentorias'}`}
          </p>

          {doDia.length === 0 ? (
            <div className={styles.vazio}>
              <p className={styles.vazioTexto}>
                Nenhuma sessão neste dia. Os dias com mentoria trazem o horário na célula.
              </p>
              {proximaDepois && (
                <button
                  type="button"
                  className={styles.proxima}
                  onClick={() => irPara(proximaDepois)}
                >
                  <span className={styles.proximaRotulo}>Próxima</span>
                  <span className={styles.proximaData}>
                    {new Date(proximaDepois.inicioIso)
                      .toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })
                      .replace(/\./g, '')}{' '}
                    · {horaCurta(proximaDepois.inicioIso)}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <ul className={styles.lista}>
              {doDia.map((s) => {
                const mentor = s.mentor;
                const estado = estadoDaSessao(s);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={styles.item}
                      data-trilha={mentor?.trilha}
                      data-estado={estado}
                      onClick={() => aoAbrirDetalhe(s.id)}
                    >
                      <span className={styles.itemHoras}>
                        <span className={styles.itemInicio}>{horaCurta(s.inicioIso)}</span>
                        <span className={styles.itemFim}>{horaCurta(s.fimIso)}</span>
                      </span>
                      <span className={styles.itemTextos}>
                        <span className={styles.itemTitulo}>{s.titulo}</span>
                        <span className={styles.itemRodape}>
                          {mentor ? TRILHAS[mentor.trilha].rotulo : ''}
                          {estado === 'ao-vivo' && <span className={styles.selo}>ao vivo</span>}
                          {estado === 'inscrito' && (
                            <span className={styles.selo}>check-in feito</span>
                          )}
                          {estado === 'lotada' && <span className={styles.selo}>lotada</span>}
                          {estado === 'encerrada' && <span className={styles.selo}>encerrada</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* A legenda existe porque a célula mostra SIGLA. Sigla sem legenda é
            charada — e a contagem do mês transforma a explicação em dado. */}
        <div className={styles.legenda}>
          <p className={styles.legendaTitulo}>Trilhas em {nomeMes.split(' de ')[0]}</p>
          <ul className={styles.legendaLista}>
            {(Object.keys(TRILHAS) as TrilhaMentor[]).map((t) => (
              <li key={t} className={styles.legendaItem} data-trilha={t}>
                <span className={styles.legendaBarra} aria-hidden="true" />
                <span className={styles.legendaSigla}>{TRILHAS[t].sigla}</span>
                <span className={styles.legendaRotulo}>{TRILHAS[t].rotulo}</span>
                <span className={styles.legendaContagem}>{porTrilhaNoMes.get(t) ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

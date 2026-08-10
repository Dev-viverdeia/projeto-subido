'use client';

import { useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import type { EstadoMentoria } from './estadoMentoria';
import { AbasFiltro } from '../../_components/filtros/AbasFiltro';
import { ItemAgenda } from './ItemAgenda';
import { chaveDoDia, rotuloDoDia } from './estadoMentoria';
import styles from './AgendaMentorias.module.css';

type FiltroDia = 'hoje' | 'amanha' | 'semana' | 'todas';

const DIA_MS = 86_400_000;

/**
 * A VISTA de agenda: filtro por dia e a lista agrupada com trilho de data à
 * esquerda. Não segura mais check-in nem modais — isso subiu para o shell
 * (`MentoriasVista`), porque é compartilhado com o calendário.
 *
 * O filtro de dia usa abas TIPOGRÁFICAS, e o seletor de vista acima usa
 * segmentado: a forma separa os dois níveis antes de qualquer rótulo ser lido.
 */
export function AgendaMentorias({
  sessoes,
  agora,
  agoraIso,
  estadoDaSessao,
  gravando,
  aoAbrirDetalhe,
  aoFazerCheckin,
  aoCancelarCheckin,
}: {
  /** Já vem só com as futuras (e a que está ao vivo), ordenadas. */
  sessoes: SessaoMentoria[];
  agora: Date;
  agoraIso: string;
  estadoDaSessao: (s: SessaoMentoria) => EstadoMentoria;
  /** Uma gravação em voo — trava os CTAs de todas as linhas. */
  gravando: boolean;
  aoAbrirDetalhe: (id: string) => void;
  aoFazerCheckin: (id: string) => void;
  aoCancelarCheckin: (id: string) => void;
}) {
  /* O padrão é TODAS, e já foi "hoje se houver hoje". Medido a 1920 com uma
     sessão no dia: o cartão da próxima acima JÁ mostra essa sessão — a lista
     abria repetindo o cartão numa linha de 66px e o resto da tela era vazio,
     com "Todas 7" escondida atrás de um clique. O cartão é o agora; a lista
     abre como panorama. "Hoje" continua a um clique, com contagem visível. */
  const [filtro, setFiltro] = useState<FiltroDia>('todas');

  /**
   * UMA REGRA SÓ, consultada duas vezes: para filtrar a lista e para contar cada
   * aba. Escrever a contagem como um segundo `filter` — o caminho curto — daria
   * dois lugares para a mesma pergunta, e eles divergiriam no primeiro ajuste de
   * borda (o que conta como "esta semana"?). A aba diria 3 e a lista mostraria 2.
   */
  const pertence = useMemo(() => {
    const hoje = chaveDoDia(agoraIso);
    const amanha = chaveDoDia(new Date(agora.getTime() + DIA_MS).toISOString());
    const fimSemana = agora.getTime() + 7 * DIA_MS;

    return (alvo: FiltroDia, s: SessaoMentoria) => {
      if (alvo === 'todas') return true;
      const dia = chaveDoDia(s.inicioIso);
      if (alvo === 'hoje') return dia === hoje;
      if (alvo === 'amanha') return dia === amanha;
      return new Date(s.inicioIso).getTime() <= fimSemana;
    };
  }, [agora, agoraIso]);

  const filtradas = useMemo(
    () => sessoes.filter((s) => pertence(filtro, s)),
    [sessoes, filtro, pertence],
  );

  /* A contagem responde "vale a pena clicar?" ANTES do clique — o mesmo
     argumento que o `ControleSegmentado` já carregava e que estas abas não
     tinham. Sem ela, descobrir que "Amanhã" está vazio custa uma navegação. */
  const abas = useMemo(
    () =>
      (
        [
          { id: 'hoje', rotulo: 'Hoje' },
          { id: 'amanha', rotulo: 'Amanhã' },
          { id: 'semana', rotulo: 'Esta semana' },
          { id: 'todas', rotulo: 'Todas' },
        ] as const
      ).map((a) => ({
        ...a,
        total: sessoes.reduce((n, s) => (pertence(a.id, s) ? n + 1 : n), 0),
      })),
    [sessoes, pertence],
  );

  const porDia = useMemo(() => {
    const grupos = new Map<string, SessaoMentoria[]>();
    for (const s of filtradas) {
      const chave = chaveDoDia(s.inicioIso);
      grupos.set(chave, [...(grupos.get(chave) ?? []), s]);
    }
    return [...grupos.entries()];
  }, [filtradas]);

  const vazio =
    filtro === 'hoje'
      ? {
          titulo: 'Hoje está livre na agenda.',
          texto: 'Use o tempo para preparar o caso que você quer levar à próxima sessão.',
        }
      : filtro === 'amanha'
        ? {
            titulo: 'Amanhã ainda não tem sessão.',
            texto: 'A agenda completa mostra as próximas oportunidades de check-in.',
          }
        : filtro === 'semana'
          ? {
              titulo: 'Nenhuma sessão nos próximos sete dias.',
              texto: 'Abra a agenda completa para escolher uma data mais adiante.',
            }
          : {
              titulo: 'A agenda futura está livre.',
              texto: 'Novas sessões entram aqui assim que forem publicadas.',
            };

  return (
    <div className={styles.raiz}>
      <div className={styles.filtro}>
        <AbasFiltro
          abas={abas}
          ativa={filtro}
          aoMudar={(id) => setFiltro(id as FiltroDia)}
          layoutId="mentorias-filtro-dia"
          ariaLabel="Filtrar por dia"
        />
      </div>

      {porDia.length === 0 ? (
        <div className={styles.vazio} role="status">
          <span className={styles.vazioIcone} aria-hidden="true">
            <CalendarRange size={20} strokeWidth={1.7} />
          </span>
          <div className={styles.vazioTexto}>
            <p className={styles.vazioTitulo}>{vazio.titulo}</p>
            <p className={styles.vazioDescricao}>{vazio.texto}</p>
          </div>
          {filtro !== 'todas' ? (
            <button type="button" className={styles.vazioAcao} onClick={() => setFiltro('todas')}>
              Ver agenda completa
            </button>
          ) : null}
        </div>
      ) : (
        <div className={styles.dias}>
          {porDia.map(([chave, doDia]) => {
            const primeiro = doDia[0];
            if (!primeiro) return null;
            const rotulo = rotuloDoDia(primeiro.inicioIso, agora);
            return (
              <section key={chave} className={styles.dia} aria-label={rotulo.principal}>
                <div className={styles.trilhoData}>
                  <h3 className={styles.diaPrincipal}>{rotulo.principal}</h3>
                  <p className={styles.diaMono}>{rotulo.mono}</p>
                </div>
                <div className={styles.itens}>
                  {doDia.map((s) => (
                    <ItemAgenda
                      key={s.id}
                      sessao={s}
                      estado={estadoDaSessao(s)}
                      gravando={gravando}
                      agora={agora}
                      aoAbrirDetalhe={() => aoAbrirDetalhe(s.id)}
                      aoFazerCheckin={() => aoFazerCheckin(s.id)}
                      aoCancelarCheckin={() => aoCancelarCheckin(s.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
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
  /* "Hoje" só é o padrão se HOUVER hoje — abrir num filtro vazio é a forma mais
     rápida de a tela parecer quebrada. */
  const haHoje = useMemo(
    () => sessoes.some((s) => chaveDoDia(s.inicioIso) === chaveDoDia(agoraIso)),
    [sessoes, agoraIso],
  );
  const [filtro, setFiltro] = useState<FiltroDia>(haHoje ? 'hoje' : 'todas');

  const filtradas = useMemo(() => {
    const hoje = chaveDoDia(agoraIso);
    const amanha = chaveDoDia(new Date(agora.getTime() + DIA_MS).toISOString());
    const fimSemana = agora.getTime() + 7 * DIA_MS;

    return sessoes.filter((s) => {
      if (filtro === 'todas') return true;
      const dia = chaveDoDia(s.inicioIso);
      if (filtro === 'hoje') return dia === hoje;
      if (filtro === 'amanha') return dia === amanha;
      return new Date(s.inicioIso).getTime() <= fimSemana;
    });
  }, [sessoes, filtro, agora, agoraIso]);

  const porDia = useMemo(() => {
    const grupos = new Map<string, SessaoMentoria[]>();
    for (const s of filtradas) {
      const chave = chaveDoDia(s.inicioIso);
      grupos.set(chave, [...(grupos.get(chave) ?? []), s]);
    }
    return [...grupos.entries()];
  }, [filtradas]);

  return (
    <div className={styles.raiz}>
      <div className={styles.filtro}>
        <AbasFiltro
          abas={[
            { id: 'hoje', rotulo: 'Hoje' },
            { id: 'amanha', rotulo: 'Amanhã' },
            { id: 'semana', rotulo: 'Esta semana' },
            { id: 'todas', rotulo: 'Todas' },
          ]}
          ativa={filtro}
          aoMudar={(id) => setFiltro(id as FiltroDia)}
          layoutId="mentorias-filtro-dia"
          ariaLabel="Filtrar por dia"
        />
        <p className={styles.contagem} aria-live="polite">
          {filtradas.length} {filtradas.length === 1 ? 'agendada' : 'agendadas'}
        </p>
      </div>

      {porDia.length === 0 ? (
        <p className={styles.vazio}>
          Nada{' '}
          {filtro === 'hoje' ? 'para hoje' : filtro === 'amanha' ? 'para amanhã' : 'no período'}.
          Veja em “Todas” as próximas sessões.
        </p>
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

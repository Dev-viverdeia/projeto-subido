'use client';

import { useMemo, useState } from 'react';
import { mentorPorId } from '@/content/mentorias';
import { TRILHAS } from '@/content/mentorias/types';
import type { EstadoMentoria, MentoriaExemplo } from '@/content/mentorias/types';
import { chaveDoDia, horaCurta } from './estadoMentoria';
import styles from './CalendarioMentorias.module.css';

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

type Celula = {
  chave: string;
  dia: number;
  iso: string;
  doMes: boolean;
  hoje: boolean;
};

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
 * Vista de CALENDÁRIO: grade do mês à esquerda, sessões do dia escolhido à
 * direita.
 *
 * A divisão é a regra de largura da casa aplicada a duas coisas de naturezas
 * diferentes na mesma tela: a GRADE precisa de área (7 colunas fixas que só
 * podem crescer em célula), a LISTA do dia precisa de MEDIDA. Uma grade de mês
 * ocupando 1600px de largura vira células de 228 quase vazias; com o painel ao
 * lado, o espaço que sobraria vira informação.
 *
 * A célula mostra no máximo DUAS sessões e um "+N". Empilhar todas faria as
 * linhas da grade terem alturas diferentes conforme o mês — e grade que muda de
 * altura ao navegar é a coisa que mais denuncia calendário improvisado.
 */
export function CalendarioMentorias({
  sessoes,
  agora,
  estadoDaSessao,
  aoAbrirDetalhe,
}: {
  /** TODAS as sessões, inclusive as encerradas: navegar para trás tem que mostrar o passado. */
  sessoes: MentoriaExemplo[];
  agora: Date;
  estadoDaSessao: (s: MentoriaExemplo) => EstadoMentoria;
  aoAbrirDetalhe: (id: string) => void;
}) {
  const [ref, setRef] = useState({ ano: agora.getFullYear(), mes: agora.getMonth() });
  const [selecionado, setSelecionado] = useState<string>(chaveDoDia(agora.toISOString()));

  const porDia = useMemo(() => {
    const mapa = new Map<string, MentoriaExemplo[]>();
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

  const doDia = porDia.get(selecionado) ?? [];
  const dataSelecionada = grade.find((c) => c.chave === selecionado);

  const andar = (passo: number) => {
    const d = new Date(ref.ano, ref.mes + passo, 1);
    setRef({ ano: d.getFullYear(), mes: d.getMonth() });
  };

  const voltarParaHoje = () => {
    setRef({ ano: agora.getFullYear(), mes: agora.getMonth() });
    setSelecionado(chaveDoDia(agora.toISOString()));
  };

  const noMesAtual = ref.ano === agora.getFullYear() && ref.mes === agora.getMonth();

  return (
    <div className={styles.raiz}>
      <div className={styles.grade}>
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
                <span className={styles.numero}>{c.dia}</span>
                {aoVivo && <span className={styles.pontoVivo} aria-hidden="true" />}

                <span className={styles.marcas}>
                  {lista.slice(0, 2).map((s) => {
                    const mentor = mentorPorId(s.mentorId);
                    return (
                      <span key={s.id} className={styles.marca}>
                        <span className={styles.marcaHora}>{horaCurta(s.inicioIso)}</span>
                        <span className={styles.marcaTrilha}>{mentor?.iniciais}</span>
                      </span>
                    );
                  })}
                  {lista.length > 2 && <span className={styles.mais}>+{lista.length - 2}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <aside className={styles.painel} aria-live="polite">
        <p className={styles.painelData}>
          {dataSelecionada
            ? new Date(dataSelecionada.iso).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : ''}
        </p>

        {doDia.length === 0 ? (
          <p className={styles.painelVazio}>
            Sem mentoria neste dia. Escolha outro no calendário — os dias com sessão trazem o
            horário na célula.
          </p>
        ) : (
          <ul className={styles.painelLista}>
            {doDia.map((s) => {
              const mentor = mentorPorId(s.mentorId);
              const estado = estadoDaSessao(s);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={styles.painelItem}
                    onClick={() => aoAbrirDetalhe(s.id)}
                  >
                    <span className={styles.itemHora}>{horaCurta(s.inicioIso)}</span>
                    <span className={styles.itemTextos}>
                      <span className={styles.itemTitulo}>{s.titulo}</span>
                      <span className={styles.itemMentor}>
                        {mentor ? TRILHAS[mentor.trilha].rotulo : ''}
                        {estado === 'ao-vivo' && <span className={styles.itemVivo}>ao vivo</span>}
                        {estado === 'inscrito' && (
                          <span className={styles.itemFeito}>check-in feito</span>
                        )}
                        {estado === 'encerrada' && (
                          <span className={styles.itemPassado}>encerrada</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}

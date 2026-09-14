'use client';

import { useEffect, useId, useRef } from 'react';
import { CalendarClock } from 'lucide-react';
import type { ConflitoHorario } from '@/lib/calls/conflitos-modelo';
import styles from './AvisoConflitoHorario.module.css';

export function AvisoConflitoHorario({
  conflito,
  pendente = false,
}: {
  conflito: ConflitoHorario;
  pendente?: boolean;
}) {
  const id = useId();
  const aviso = useRef<HTMLElement>(null);
  useEffect(() => {
    const quadro = requestAnimationFrame(() => aviso.current?.focus());
    return () => cancelAnimationFrame(quadro);
  }, [conflito]);
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dia = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
  return (
    <section ref={aviso} tabIndex={-1} aria-labelledby={`${id}-titulo`} className={styles.aviso}>
      <div className={styles.cabecalho}>
        <CalendarClock size={22} strokeWidth={1.7} aria-hidden="true" />
        <h3 id={`${id}-titulo`}>
          {conflito.total === 1
            ? 'Você já tem uma reunião neste horário'
            : `${conflito.total} reuniões coincidem com este horário`}
        </h3>
      </div>
      <ul className={styles.reunioes}>
        {conflito.reunioes.map((reuniao) => {
          const inicio = new Date(reuniao.inicio);
          const fim = new Date(inicio.getTime() + reuniao.duracao * 60_000);
          const outroDia = inicio.toDateString() !== fim.toDateString();
          return (
            <li key={reuniao.id}>
              <div className={styles.horario}>
                <span>
                  {dia.format(inicio)}
                  {outroDia ? ` a ${dia.format(fim)}` : ''}
                </span>
                <strong>
                  {hora.format(inicio)}–{hora.format(fim)}
                </strong>
              </div>
              <span className={styles.titulo}>{reuniao.titulo}</span>
            </li>
          );
        })}
      </ul>
      {conflito.total > conflito.reunioes.length && (
        <p className={styles.nota}>
          E mais {conflito.total - conflito.reunioes.length} reuniões nesse intervalo.
        </p>
      )}
      <label className={styles.confirmacao}>
        <input
          type="checkbox"
          name="confirmacaoHorario"
          value={conflito.confirmacao}
          disabled={pendente}
        />
        <span>Manter este horário mesmo assim</span>
      </label>
      <p className={styles.nota}>
        Conferimos as reuniões da Subido. Outros eventos do Google não entram nesta consulta.
      </p>
    </section>
  );
}

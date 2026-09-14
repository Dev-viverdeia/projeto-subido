'use client';

import { useId } from 'react';
import styles from './AvisoConflitoHorario.module.css';

export function AlternativasHorario({
  horarios,
  duracao,
  pendente,
  aoEscolher,
}: {
  horarios?: string[];
  duracao: number;
  pendente: boolean;
  aoEscolher: (inicio: string) => void;
}) {
  const id = useId();
  const dia = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className={styles.alternativas}>
      <h4 id={id}>Escolher outro horário</h4>
      {horarios?.length ? (
        <div role="group" aria-labelledby={id} className={styles.opcoes}>
          {horarios.map((inicio) => {
            const data = new Date(inicio);
            const intervalo = `${hora.format(data)}–${hora.format(new Date(data.getTime() + duracao * 60_000))}`;
            return (
              <button
                type="button"
                key={inicio}
                disabled={pendente}
                className={styles.opcao}
                aria-label={`Usar ${dia.format(data)}, ${intervalo}`}
                onClick={() => aoEscolher(inicio)}
              >
                <span>{dia.format(data)}</span>
                <strong>{intervalo}</strong>
              </button>
            );
          })}
        </div>
      ) : (
        <p className={styles.nota}>
          {horarios
            ? 'Sem alternativas nesse período. Você pode escolher outra data.'
            : 'Não foi possível buscar alternativas. Você pode ajustar o horário.'}
        </p>
      )}
      <p className={styles.nota}>
        Dias úteis, das 9h às 18h, até 7 dias a partir da data escolhida. Seu fuso.
      </p>
    </div>
  );
}

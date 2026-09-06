'use client';
import { CalendarCheck2, Check, Mail } from 'lucide-react';
import { Input } from '@/design-system/via';
import styles from './FormularioAgendarCall.module.css';

export function CamposConviteGoogle({
  emailAgenda,
  email,
  erro,
  aoEditar,
}: {
  emailAgenda: string | null;
  email: string;
  erro?: string;
  aoEditar: (email: string) => void;
}) {
  return (
    <section className={styles.calendar} aria-labelledby="convite-google-titulo">
      <div className={styles.calendarTopo}>
        <span className={styles.calendarIcone} aria-hidden="true">
          <CalendarCheck2 size={19} strokeWidth={1.7} />
        </span>
        <div>
          <h3 id="convite-google-titulo">Convite pelo Google Calendar</h3>
          <p>O evento chega por e-mail e leva o cliente direto para a sala da Subido.</p>
        </div>
        <small>{emailAgenda}</small>
      </div>

      <div className={styles.calendarCorpo}>
        <input type="hidden" name="enviarConviteGoogle" value="on" />
        <div className={styles.conviteAtivo}>
          <span aria-hidden="true">
            <Check size={14} strokeWidth={2.2} />
          </span>
          <span>
            <strong>Convite automático</strong>
            <small>O acesso será pela sala da Subido.</small>
          </span>
        </div>
        <Input
          id="calls-convidado-email"
          name="convidadoEmail"
          type="email"
          label="E-mail do cliente"
          placeholder="cliente@empresa.com.br"
          iconLeft={<Mail size={16} strokeWidth={1.7} aria-hidden="true" />}
          value={email}
          error={erro}
          onChange={(evento) => aoEditar(evento.target.value)}
          required
        />
      </div>
    </section>
  );
}

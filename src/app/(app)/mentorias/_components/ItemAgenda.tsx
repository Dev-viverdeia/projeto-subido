'use client';

import { Avatar, Button } from '@/design-system/via';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import type { EstadoMentoria } from './estadoMentoria';
import { duracaoMin, horaCurta, rotuloDoDia } from './estadoMentoria';
import { iniciais } from '../../_components/iniciais';
import styles from './ItemAgenda.module.css';

/**
 * Uma linha da agenda (~60px): hora | título + mentor | vagas + CTA por estado.
 * A MATRIZ DE ESTADOS é o coração — cada estado tem exatamente uma cara:
 *
 *   ao-vivo        dot pulsante + AO VIVO + entrar (desabilitado nesta fase)
 *   checkin-aberto botão "Fazer check-in"
 *   inscrito       pill "✓ Check-in confirmado" + cancelar
 *   lotada         "12/12 · lotada" em mono, sem CTA
 *   fora-da-janela "check-in abre SEX · 4 JUL" em mono
 *   encerrada      não renderiza (filtrada antes)
 *
 * A linha inteira abre o detalhe; CTAs internos param a propagação.
 */
export function ItemAgenda({
  sessao,
  estado,
  agora,
  aoAbrirDetalhe,
  aoFazerCheckin,
  aoCancelarCheckin,
}: {
  sessao: SessaoMentoria;
  estado: EstadoMentoria;
  agora: Date;
  aoAbrirDetalhe: () => void;
  aoFazerCheckin: () => void;
  aoCancelarCheckin: () => void;
}) {
  const mentor = sessao.mentor;
  const lotada = estado === 'lotada';

  return (
    <article
      className={styles.item}
      data-ao-vivo={estado === 'ao-vivo' ? '' : undefined}
      role="button"
      tabIndex={0}
      onClick={aoAbrirDetalhe}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          aoAbrirDetalhe();
        }
      }}
    >
      <div className={styles.hora}>
        <span className={styles.horaValor}>{horaCurta(sessao.inicioIso)}</span>
        <span className={styles.duracao}>{duracaoMin(sessao)} min</span>
      </div>

      <span className={styles.divisor} aria-hidden="true" />

      <div className={styles.centro}>
        <p className={styles.titulo}>{sessao.titulo}</p>
        {/* Só o NOME. A headline ("Encontro semanal em grupo · Comunidade
            Subido") ocupava 232px repetindo a mesma frase em cada uma das 34
            linhas — em lista, informação idêntica em toda linha é ruído, não
            contexto. Ela vive na ficha da sessão, onde é lida uma vez. */}
        <div className={styles.mentor}>
          <Avatar initials={mentor ? iniciais(mentor.nome) : '—'} size="xs" />
          <span className={styles.mentorNome}>{mentor?.nome}</span>
        </div>
      </div>

      <div className={styles.direita}>
        {estado === 'ao-vivo' && (
          <>
            <span className={styles.aoVivo}>
              <span className={styles.dot} aria-hidden="true" />
              ao vivo
            </span>
            <Button
              variant="primary"
              size="sm"
              disabled
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              Entrar na sala
            </Button>
          </>
        )}

        {estado === 'checkin-aberto' && (
          <>
            <span className={styles.vagas}>
              {sessao.inscritos}/{sessao.vagas}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                aoFazerCheckin();
              }}
            >
              Fazer check-in
            </Button>
          </>
        )}

        {estado === 'inscrito' && (
          <button
            type="button"
            className={styles.confirmado}
            onClick={(e) => {
              e.stopPropagation();
              aoCancelarCheckin();
            }}
            aria-label="Cancelar check-in"
          >
            ✓ Check-in confirmado
          </button>
        )}

        {lotada && (
          <span className={styles.vagas}>
            {sessao.inscritos}/{sessao.vagas} · lotada
          </span>
        )}

        {estado === 'fora-da-janela' && (
          <span className={styles.janela}>
            check-in abre {rotuloDoDia(sessao.inicioIso, agora).mono}
          </span>
        )}
      </div>
    </article>
  );
}

'use client';

import { Avatar, Button, Pill } from '@/design-system/via';
import { mentorPorId } from '@/content/mentorias';
import type { EstadoMentoria, MentoriaExemplo } from '@/content/mentorias/types';
import { comecaEm, duracaoMin, horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './CartaoProxima.module.css';

/**
 * O hero da agenda: a sessão AO VIVO agora — ou a próxima. Única superfície
 * escura da tela, fixa acima dos filtros (filtrar a lista não esconde o que
 * está acontecendo agora).
 */
export function CartaoProxima({
  sessao,
  estado,
  agora,
  aoAbrirDetalhe,
  aoFazerCheckin,
}: {
  sessao: MentoriaExemplo;
  estado: EstadoMentoria;
  agora: Date;
  aoAbrirDetalhe: () => void;
  aoFazerCheckin: () => void;
}) {
  const aoVivo = estado === 'ao-vivo';
  const mentor = mentorPorId(sessao.mentorId);
  const dia = rotuloDoDia(sessao.inicioIso, agora);
  const contagem = comecaEm(sessao, agora);

  return (
    <article
      className={`${styles.cartao} via-mesh-navy via-noise`}
      data-ao-vivo={aoVivo ? '' : undefined}
    >
      <span className={styles.sheen} aria-hidden="true" />
      <div className={styles.conteudo}>
        <p className={styles.eyebrow}>
          {aoVivo ? (
            <Pill variant="live" size="sm">
              ao vivo agora
            </Pill>
          ) : (
            <>
              Próxima mentoria
              {contagem && <span className={styles.contagem}> · {contagem}</span>}
            </>
          )}
        </p>

        <h2 className={styles.titulo}>{sessao.titulo}</h2>

        <div className={styles.mentor}>
          <Avatar initials={mentor?.iniciais ?? '—'} size="sm" />
          <div className={styles.mentorTextos}>
            <p className={styles.mentorNome}>{mentor?.nome}</p>
            <p className={styles.mentorHeadline}>{mentor?.headline}</p>
          </div>
        </div>

        <p className={styles.meta}>
          {dia.principal === 'Hoje' ? 'HOJE' : dia.mono} · {horaCurta(sessao.inicioIso)}–
          {horaCurta(sessao.fimIso)} · {duracaoMin(sessao)} MIN · {sessao.inscritos}/{sessao.vagas}{' '}
          VAGAS
        </p>

        <div className={styles.acoes}>
          {estado === 'checkin-aberto' && (
            <Button variant="primary" onClick={aoFazerCheckin}>
              Fazer check-in
            </Button>
          )}
          {estado === 'inscrito' && (
            <span className={styles.confirmado}>✓ Check-in confirmado</span>
          )}
          {aoVivo && (
            <Button variant="primary" disabled>
              Entrar na sala
            </Button>
          )}
          <Button variant="secondary" onClick={aoAbrirDetalhe}>
            Ver detalhes
          </Button>
        </div>
        {aoVivo && (
          <p className={styles.aviso}>A sala de vídeo entra na próxima fase da plataforma.</p>
        )}
      </div>
    </article>
  );
}

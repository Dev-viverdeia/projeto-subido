'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Button, Modal } from '@/design-system/via';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { TRILHAS } from '@/lib/mentorias/tipos';
import { RetratoMentor } from '../../_components/RetratoMentor';
import { Visto } from '../../_components/PillEstado';
import type { EstadoMentoria } from './estadoMentoria';
import { duracaoMin, horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './MentoriasVista.module.css';

export function ModalDetalheMentoria({
  sessao,
  estado,
  agora,
  gravando,
  aoFechar,
  aoFazerCheckin,
  aoCancelarCheckin,
}: {
  sessao: SessaoMentoria | null;
  estado: EstadoMentoria | null;
  agora: Date;
  gravando: boolean;
  aoFechar: () => void;
  aoFazerCheckin: (id: string) => void;
  aoCancelarCheckin: (id: string) => void;
}) {
  return (
    <Modal open={sessao !== null} onClose={aoFechar} title={sessao?.titulo} size="md">
      {sessao && estado ? (
        <div className={styles.detalhe}>
          <dl className={styles.ficha}>
            <div className={styles.fichaItem}>
              <dt className={styles.fichaRotulo}>Quando</dt>
              <dd className={styles.fichaValor}>{rotuloDoDia(sessao.inicioIso, agora).mono}</dd>
            </div>
            <div className={styles.fichaItem}>
              <dt className={styles.fichaRotulo}>Horário</dt>
              <dd className={styles.fichaValor}>
                {horaCurta(sessao.inicioIso)}–{horaCurta(sessao.fimIso)}
              </dd>
            </div>
            <div className={styles.fichaItem}>
              <dt className={styles.fichaRotulo}>Duração</dt>
              <dd className={styles.fichaValor}>{duracaoMin(sessao)} min</dd>
            </div>
            <div className={styles.fichaItem}>
              <dt className={styles.fichaRotulo}>Vagas</dt>
              <dd className={styles.fichaValor}>
                {sessao.inscritos}/{sessao.vagas}
              </dd>
            </div>
          </dl>

          <p className={styles.detalheTexto}>{sessao.descricao}</p>

          {sessao.mentor ? (
            <div className={styles.mentorCartao} data-trilha={sessao.mentor.trilha}>
              <RetratoMentor
                nome={sessao.mentor.nome}
                fotoUrl={sessao.mentor.foto_url}
                tamanho="md"
              />
              <span className={styles.mentorTextos}>
                <span className={styles.mentorNome}>{sessao.mentor.nome}</span>
                <span className={styles.mentorHeadline}>{sessao.mentor.headline}</span>
              </span>
              <span className={styles.mentorTrilha}>{TRILHAS[sessao.mentor.trilha].rotulo}</span>
            </div>
          ) : null}

          <div className={styles.acoesFicha}>
            {estado === 'checkin-aberto' ? (
              <Button
                variant="primary"
                disabled={gravando}
                onClick={() => {
                  aoFechar();
                  aoFazerCheckin(sessao.id);
                }}
              >
                Fazer check-in · {sessao.custoCreditos} cr.
              </Button>
            ) : null}

            {estado === 'inscrito' ? (
              <>
                <span className={styles.fichaConfirmado}>
                  <Visto tamanho={12} />
                  Check-in confirmado
                </span>
                <Button
                  variant="destructive"
                  disabled={gravando}
                  iconLeft={<X size={15} strokeWidth={2} aria-hidden="true" />}
                  onClick={() => {
                    aoFechar();
                    aoCancelarCheckin(sessao.id);
                  }}
                >
                  Cancelar check-in
                </Button>
              </>
            ) : null}

            {estado === 'ao-vivo' ? (
              <Link
                href={`/mentorias/${sessao.id}`}
                className="via-btn via-btn--primary via-btn--md"
              >
                Entrar na sala
              </Link>
            ) : null}

            {estado === 'lotada' || estado === 'encerrada' || estado === 'fora-da-janela' ? (
              <span className={styles.fichaNota}>
                {estado === 'lotada'
                  ? `Sessão lotada: ${sessao.inscritos} de ${sessao.vagas} vagas.`
                  : estado === 'encerrada'
                    ? 'Sessão encerrada.'
                    : `O check-in abre ${rotuloDoDia(sessao.inicioIso, agora).mono}.`}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

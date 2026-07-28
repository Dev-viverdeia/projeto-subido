'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { mentorPorId } from '@/content/mentorias';
import { Button, Modal } from '@/design-system/via';
import type { EstadoMentoria, MentoriaExemplo } from '@/content/mentorias/types';
import { atualizarUrlFiltros } from '../../_components/filtros/espelhoUrl';
import { AgendaMentorias } from './AgendaMentorias';
import { CalendarioMentorias } from './CalendarioMentorias';
import { CartaoProxima } from './CartaoProxima';
import { SeletorVista, type IdVista } from './SeletorVista';
import { duracaoMin, estadoDe, horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './MentoriasVista.module.css';

/**
 * O SHELL das mentorias: segura tudo que as DUAS vistas compartilham — o
 * check-in, a ficha da sessão, a confirmação — e troca só o miolo.
 *
 * Por que o estado sobe para cá: o check-in feito no calendário tem que aparecer
 * na agenda, e a mesma ficha de sessão abre dos dois lados. Estado duplicado por
 * vista seria a garantia de divergirem no primeiro bug.
 *
 * O CARTÃO DA PRÓXIMA FICA ACIMA DAS ABAS, fora da troca. Ele é o AGORA — a
 * sessão ao vivo ou a próxima —, e trocar o modo de leitura não pode esconder a
 * única coisa da tela que é urgente.
 *
 * O check-in vive em estado local da navegação: demonstra o fluxo completo
 * (confirmar, cancelar, vaga contada) sem fingir persistência. O aviso de
 * demonstração fica na página, acima daqui.
 */
export function MentoriasVista({
  sessoes,
  agoraIso,
  vistaInicial,
}: {
  sessoes: MentoriaExemplo[];
  agoraIso: string;
  vistaInicial: IdVista;
}) {
  /* O MESMO instante no servidor e na hidratação — "começa em 45 min" idêntico
     dos dois lados. O relógio não avança na tela; avança no refresh. */
  const agora = useMemo(() => new Date(agoraIso), [agoraIso]);

  const [vista, setVista] = useState<IdVista>(vistaInicial);
  const [inscritos, setInscritos] = useState<string[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  /* A vista entra na URL: é escolha de LEITURA, não estado do dispositivo — um
     link para o calendário reproduz o calendário no aparelho de quem recebe.
     `replaceState` direto (ver espelhoUrl): `router.replace` re-renderizaria o
     servidor a cada troca de aba, numa rota dinâmica. */
  useEffect(() => {
    atualizarUrlFiltros({ vista: vista === 'agenda' ? null : vista });
  }, [vista]);

  const estadoComInscricao = useCallback(
    (s: MentoriaExemplo): EstadoMentoria => estadoDe(s, agora, inscritos.includes(s.id)),
    [agora, inscritos],
  );

  const estaAoVivo = useCallback(
    (s: MentoriaExemplo) =>
      agora.getTime() >= new Date(s.inicioIso).getTime() &&
      agora.getTime() < new Date(s.fimIso).getTime(),
    [agora],
  );

  /* A AGENDA só olha para frente; o CALENDÁRIO precisa do passado, senão navegar
     para o mês anterior mostra um mês vazio. Duas listas, uma fonte. */
  const futuras = useMemo(
    () =>
      sessoes
        .filter((s) => estadoDe(s, agora, false) !== 'encerrada' || estaAoVivo(s))
        .sort((a, b) => a.inicioIso.localeCompare(b.inicioIso)),
    [sessoes, agora, estaAoVivo],
  );

  const destaque = futuras.find((s) => estaAoVivo(s)) ?? futuras[0] ?? null;

  const porId = useCallback(
    (id: string | null) => (id ? (sessoes.find((s) => s.id === id) ?? null) : null),
    [sessoes],
  );
  const detalhe = porId(detalheId);
  const confirmando = porId(confirmandoId);
  const mentorDoDetalhe = detalhe ? mentorPorId(detalhe.mentorId) : undefined;

  const abrirDetalhe = useCallback((id: string) => setDetalheId(id), []);
  const pedirCheckin = useCallback((id: string) => setConfirmandoId(id), []);
  const cancelarCheckin = useCallback(
    (id: string) => setInscritos((atual) => atual.filter((x) => x !== id)),
    [],
  );

  return (
    <div className={styles.raiz}>
      {destaque && (
        <CartaoProxima
          sessao={destaque}
          estado={estadoComInscricao(destaque)}
          agora={agora}
          aoAbrirDetalhe={() => abrirDetalhe(destaque.id)}
          aoFazerCheckin={() => pedirCheckin(destaque.id)}
        />
      )}

      <div className={styles.chrome}>
        <SeletorVista ativa={vista} aoMudar={setVista} />
      </div>

      {vista === 'agenda' ? (
        <AgendaMentorias
          sessoes={futuras}
          agora={agora}
          agoraIso={agoraIso}
          estadoDaSessao={estadoComInscricao}
          aoAbrirDetalhe={abrirDetalhe}
          aoFazerCheckin={pedirCheckin}
          aoCancelarCheckin={cancelarCheckin}
        />
      ) : (
        <CalendarioMentorias
          sessoes={sessoes}
          agora={agora}
          estadoDaSessao={estadoComInscricao}
          aoAbrirDetalhe={abrirDetalhe}
        />
      )}

      {/* Ficha da sessão — a mesma dos dois lados. */}
      <Modal
        open={detalhe !== null}
        onClose={() => setDetalheId(null)}
        title={detalhe?.titulo}
        size="md"
      >
        {detalhe && (
          <div className={styles.detalhe}>
            <p className={styles.detalheMeta}>
              {rotuloDoDia(detalhe.inicioIso, agora).mono} · {horaCurta(detalhe.inicioIso)}–
              {horaCurta(detalhe.fimIso)} · {duracaoMin(detalhe)} min · {detalhe.inscritos}/
              {detalhe.vagas} vagas
            </p>
            <p className={styles.detalheTexto}>{detalhe.descricao}</p>
            {mentorDoDetalhe && (
              <p className={styles.detalheMentor}>
                {mentorDoDetalhe.nome} — {mentorDoDetalhe.headline}
              </p>
            )}
            {estadoComInscricao(detalhe) === 'checkin-aberto' && (
              <Button
                variant="primary"
                onClick={() => {
                  setDetalheId(null);
                  setConfirmandoId(detalhe.id);
                }}
              >
                Fazer check-in
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmação de check-in */}
      <Modal
        open={confirmando !== null}
        onClose={() => setConfirmandoId(null)}
        title="Confirmar check-in"
        size="sm"
        footer={
          <div className={styles.confirmarAcoes}>
            <Button variant="ghost" onClick={() => setConfirmandoId(null)}>
              Voltar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (confirmandoId) setInscritos((atual) => [...atual, confirmandoId]);
                setConfirmandoId(null);
              }}
            >
              Confirmar
            </Button>
          </div>
        }
      >
        {confirmando && (
          <p className={styles.confirmarTexto}>
            Você garante a vaga em “{confirmando.titulo}” (
            {rotuloDoDia(confirmando.inicioIso, agora).principal.toLowerCase()},{' '}
            {horaCurta(confirmando.inicioIso)}). Dá para cancelar até o início — a vaga volta para a
            fila.
          </p>
        )}
      </Modal>
    </div>
  );
}

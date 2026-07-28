'use client';

import { useMemo, useState } from 'react';
import { Button, Modal } from '@/design-system/via';
import type { MentoriaExemplo } from '@/content/mentorias/types';
import { AbasFiltro } from '../../_components/filtros/AbasFiltro';
import { CartaoProxima } from './CartaoProxima';
import { ItemAgenda } from './ItemAgenda';
import { chaveDoDia, duracaoMin, estadoDe, horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './AgendaMentorias.module.css';

type FiltroDia = 'hoje' | 'amanha' | 'semana' | 'todas';

const DIA_MS = 86_400_000;

/**
 * A agenda inteira: hero da próxima sessão (fixo — filtrar não esconde o agora),
 * filtro por dia e a lista agrupada com trilho de data à esquerda.
 *
 * O check-in vive em estado LOCAL da sessão de navegação — demonstra o fluxo
 * completo (confirmar, cancelar, vaga contada) sem fingir persistência. O aviso
 * de demonstração fica na página, acima daqui.
 */
export function AgendaMentorias({
  sessoes,
  agoraIso,
}: {
  sessoes: MentoriaExemplo[];
  agoraIso: string;
}) {
  /* O MESMO instante no servidor e na hidratação — "começa em 45 min" idêntico
     dos dois lados. O relógio não avança na tela; avança no refresh. */
  const agora = useMemo(() => new Date(agoraIso), [agoraIso]);

  const [inscritos, setInscritos] = useState<string[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  const vivas = useMemo(
    () =>
      sessoes
        .filter((s) => estadoDe(s, agora, false) !== 'encerrada' || estaAoVivo(s, agora))
        .sort((a, b) => a.inicioIso.localeCompare(b.inicioIso)),
    [sessoes, agora],
  );

  function estaAoVivo(s: MentoriaExemplo, ref: Date) {
    return (
      ref.getTime() >= new Date(s.inicioIso).getTime() &&
      ref.getTime() < new Date(s.fimIso).getTime()
    );
  }

  const destaque = vivas.find((s) => estaAoVivo(s, agora)) ?? vivas[0] ?? null;

  const haHoje = vivas.some(
    (s) => chaveDoDia(s.inicioIso) === chaveDoDia(agoraIso) && !estaAoVivo(s, agora),
  );
  const [filtro, setFiltro] = useState<FiltroDia>(haHoje ? 'hoje' : 'todas');

  const filtradas = useMemo(() => {
    const hoje = chaveDoDia(agoraIso);
    const amanha = chaveDoDia(new Date(agora.getTime() + DIA_MS).toISOString());
    const fimSemana = agora.getTime() + 7 * DIA_MS;

    return vivas.filter((s) => {
      if (filtro === 'todas') return true;
      const dia = chaveDoDia(s.inicioIso);
      if (filtro === 'hoje') return dia === hoje;
      if (filtro === 'amanha') return dia === amanha;
      return new Date(s.inicioIso).getTime() <= fimSemana;
    });
  }, [vivas, filtro, agora, agoraIso]);

  const porDia = useMemo(() => {
    const grupos = new Map<string, MentoriaExemplo[]>();
    for (const s of filtradas) {
      const chave = chaveDoDia(s.inicioIso);
      grupos.set(chave, [...(grupos.get(chave) ?? []), s]);
    }
    return [...grupos.entries()];
  }, [filtradas]);

  const detalhe = detalheId ? (vivas.find((s) => s.id === detalheId) ?? null) : null;
  const confirmando = confirmandoId ? (vivas.find((s) => s.id === confirmandoId) ?? null) : null;

  const confirmarCheckin = () => {
    if (confirmandoId) setInscritos((atual) => [...atual, confirmandoId]);
    setConfirmandoId(null);
  };

  const estadoComInscricao = (s: MentoriaExemplo) => estadoDe(s, agora, inscritos.includes(s.id));

  return (
    <div className={styles.raiz}>
      {destaque && (
        <CartaoProxima
          sessao={destaque}
          estado={estadoComInscricao(destaque)}
          agora={agora}
          aoAbrirDetalhe={() => setDetalheId(destaque.id)}
          aoFazerCheckin={() => setConfirmandoId(destaque.id)}
        />
      )}

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
                      estado={estadoComInscricao(s)}
                      agora={agora}
                      aoAbrirDetalhe={() => setDetalheId(s.id)}
                      aoFazerCheckin={() => setConfirmandoId(s.id)}
                      aoCancelarCheckin={() =>
                        setInscritos((atual) => atual.filter((id) => id !== s.id))
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Detalhe da sessão */}
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
            <p className={styles.detalheMentor}>
              Com {detalhe.mentor.nome} — {detalhe.mentor.headline}
            </p>
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
            <Button variant="primary" onClick={confirmarCheckin}>
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

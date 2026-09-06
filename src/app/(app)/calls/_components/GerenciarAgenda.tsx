'use client';

import { useActionState, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, CalendarX2 } from 'lucide-react';
import { Button, Input } from '@/design-system/via';
import type { ReuniaoCall } from '@/lib/calls/reuniao-modelo';
import { podeAlterarHorario } from '@/lib/calls/agenda-modelo';
import { alterarAgendaReuniao, type EstadoAlteracaoAgenda } from '@/lib/calls/agenda-actions';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { RetornoOperacao } from '../../_components/RetornoOperacao';
import styles from './GerenciarAgenda.module.css';

const INICIAL: EstadoAlteracaoAgenda = { status: 'erro' };
function horarioLocal(iso: string) {
  const data = new Date(iso);
  return new Date(data.getTime() - data.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function GerenciarAgenda({
  reuniao,
  abertoInicial = false,
  apenasModal = false,
}: {
  reuniao: ReuniaoCall;
  abertoInicial?: boolean;
  apenasModal?: boolean;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  return (
    <>
      {!apenasModal && podeAlterarHorario(reuniao.status) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAberto(true)}
          iconLeft={<CalendarClock size={16} aria-hidden="true" />}
        >
          Alterar reunião
        </Button>
      )}
      {aberto && <EditorAgenda reuniao={reuniao} aoFechar={() => setAberto(false)} />}
    </>
  );
}

function EditorAgenda({ reuniao, aoFechar }: { reuniao: ReuniaoCall; aoFechar: () => void }) {
  const router = useRouter();
  const id = useId();
  const [cancelar, setCancelar] = useState(false);
  const [quando, setQuando] = useState(horarioLocal(reuniao.agendadaPara));
  const [duracao, setDuracao] = useState(String(reuniao.duracaoMinutos));
  const [estado, acao, pendente] = useActionState(
    async (anterior: EstadoAlteracaoAgenda, form: FormData) => {
      try {
        const resultado = await alterarAgendaReuniao(anterior, form);
        if (resultado.status !== 'erro') router.refresh();
        return resultado;
      } catch {
        return {
          status: 'erro' as const,
          mensagem:
            'Não foi possível confirmar a alteração. Atualize a página antes de tentar novamente.',
        };
      }
    },
    INICIAL,
  );
  const finalizado = estado.status !== 'erro';
  const tituloSucesso = cancelar ? 'Reunião cancelada' : 'Horário atualizado';
  const reconectarHref = `/api/integracoes/google-calendar/conectar?retorno=${encodeURIComponent('/reunioes')}`;
  return (
    <ModalOperacao
      open
      onClose={aoFechar}
      blocked={pendente}
      size="md"
      label="Reuniões"
      title={cancelar ? 'Cancelar esta reunião?' : 'Alterar reunião'}
      description={
        cancelar
          ? 'A sala será encerrada e o Google receberá o cancelamento.'
          : 'A mesma sala, em um novo horário.'
      }
      footer={
        finalizado ? (
          <Button onClick={aoFechar}>Fechar</Button>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={pendente}
              onClick={cancelar ? () => setCancelar(false) : aoFechar}
            >
              {cancelar ? 'Manter reunião' : 'Voltar'}
            </Button>
            <Button type="submit" form={id} loading={pendente}>
              {pendente
                ? 'Atualizando agenda…'
                : cancelar
                  ? 'Cancelar reunião'
                  : 'Salvar novo horário'}
            </Button>
          </>
        )
      }
    >
      <form id={id} action={acao} className={styles.formulario}>
        <input type="hidden" name="reuniao" value={reuniao.id} />
        <input type="hidden" name="versao" value={reuniao.atualizadaEm ?? ''} />
        <input type="hidden" name="acao" value={cancelar ? 'cancelar' : 'reagendar'} />
        <input
          type="hidden"
          name="offsetMinutos"
          value={Number.isFinite(Date.parse(quando)) ? new Date(quando).getTimezoneOffset() : 0}
        />
        <div className={styles.resumo}>
          <CalendarClock size={22} strokeWidth={1.7} aria-hidden="true" />
          <div>
            <strong>{reuniao.titulo}</strong>
            <span>{reuniao.convidadoEmail ?? reuniao.empresa}</span>
          </div>
        </div>
        {estado.mensagem || finalizado ? (
          <RetornoOperacao
            tom={estado.status === 'concluido' ? 'sucesso' : 'erro'}
            titulo={
              estado.status === 'concluido'
                ? tituloSucesso
                : estado.status === 'pendente'
                  ? 'Falta atualizar o convite'
                  : 'Confira antes de continuar'
            }
            descricao={estado.mensagem}
            acao={
              estado.reconectar ? (
                <a className="via-btn via-btn--secondary via-btn--sm" href={reconectarHref}>
                  Reconectar agenda
                </a>
              ) : undefined
            }
          />
        ) : null}
        {!cancelar && !finalizado && (
          <>
            <fieldset disabled={pendente} className={styles.campos}>
              <Input
                id={`${id}-data`}
                name="agendadaPara"
                type="datetime-local"
                label="Data e horário"
                value={quando}
                onChange={(e) => setQuando(e.target.value)}
                required
                data-autofocus
              />
              <Input
                id={`${id}-duracao`}
                name="duracao"
                type="number"
                label="Duração (minutos)"
                min={15}
                max={240}
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                required
              />
            </fieldset>
            <p className={styles.nota}>
              Horário no seu fuso. O convite será atualizado para o cliente.
            </p>
            <Button
              variant="ghost"
              disabled={pendente}
              className={styles.cancelar}
              onClick={() => setCancelar(true)}
              iconLeft={<CalendarX2 size={16} aria-hidden="true" />}
            >
              Cancelar reunião
            </Button>
          </>
        )}
      </form>
    </ModalOperacao>
  );
}

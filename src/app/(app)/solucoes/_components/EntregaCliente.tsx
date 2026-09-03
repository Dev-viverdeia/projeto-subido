'use client';

import { useActionState } from 'react';
import {
  ArrowRight,
  BellRing,
  Check,
  Clock3,
  ExternalLink,
  MailCheck,
  MailWarning,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  prepararEntregaCliente,
  reenviarNotificacaoEntregaCliente,
} from '@/lib/projetos-execucao/entrega-actions';
import type { EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import type { EventoProjetoExecucao, TarefaProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_CLIENTE } from '@/lib/projetos-execucao/status';
import { montarGuiaValidacaoTarefa } from '@/lib/projetos-execucao/validacao-tarefa';
import styles from './EntregaCliente.module.css';

const INICIAL: EstadoProjetoExecucao = {};

export function EntregaCliente({
  projetoId,
  tarefa,
  portalAtivo,
  clienteEmail,
  notificacao,
  lembrete,
  aceiteFinal = false,
  encerramentoPronto = true,
}: {
  projetoId: string;
  tarefa: TarefaProjetoExecucao;
  portalAtivo: boolean;
  clienteEmail: string | null;
  notificacao: EventoProjetoExecucao | null;
  lembrete: EventoProjetoExecucao | null;
  aceiteFinal?: boolean;
  encerramentoPronto?: boolean;
}) {
  const [estado, acao, pendente] = useActionState(prepararEntregaCliente, INICIAL);
  const [estadoReenvio, reenviar, reenviando] = useActionState(
    reenviarNotificacaoEntregaCliente,
    INICIAL,
  );
  const concluida = tarefa.status === 'concluida';
  const decidida = tarefa.clienteStatus === 'aprovada';
  const guiaValidacao = montarGuiaValidacaoTarefa(tarefa);

  if (!concluida && tarefa.clienteStatus === 'nao_solicitada') return null;

  return (
    <section
      className={styles.entrega}
      data-status={tarefa.clienteStatus}
      data-final={aceiteFinal || undefined}
    >
      <header>
        <span className={styles.icone}>
          <ShieldCheck size={17} aria-hidden="true" />
        </span>
        <div>
          <p>{aceiteFinal ? 'Encerramento do projeto' : 'Validação do cliente'}</p>
          <h2>
            {aceiteFinal && tarefa.clienteStatus === 'nao_solicitada'
              ? 'Aceite final pronto para envio'
              : ROTULO_STATUS_CLIENTE[tarefa.clienteStatus]}
          </h2>
        </div>
        <span className={styles.selo}>{portalAtivo ? 'Portal ativo' : 'Portal privado'}</span>
      </header>

      {decidida || tarefa.clienteStatus === 'aguardando' ? (
        <div
          className={styles.resumo}
          data-aguardando={tarefa.clienteStatus === 'aguardando' || undefined}
        >
          {tarefa.clienteStatus === 'aguardando' && (
            <>
              <div className={styles.aguardando}>
                <Clock3 size={17} aria-hidden="true" />
                <span>
                  <strong>Agora é com o cliente.</strong>A entrega já está no portal para aprovação
                  ou pedido de ajuste.
                </span>
              </div>
              <NotificacaoCliente
                projetoId={projetoId}
                notificacao={notificacao}
                lembrete={lembrete}
                email={clienteEmail}
                estado={estadoReenvio}
                reenviando={reenviando}
                action={reenviar}
              />
            </>
          )}
          {tarefa.clienteNota && <p>{tarefa.clienteNota}</p>}
          {tarefa.entregavelUrl && (
            <a href={tarefa.entregavelUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} aria-hidden="true" /> Abrir entregável compartilhado
            </a>
          )}
          {decidida && (
            <span>
              <Check size={14} aria-hidden="true" />{' '}
              {aceiteFinal
                ? 'Projeto encerrado com aceite do cliente'
                : 'Confirmação registrada no histórico'}
            </span>
          )}
        </div>
      ) : (
        <form action={acao}>
          <input type="hidden" name="projeto" value={projetoId} />
          <input type="hidden" name="tarefa" value={tarefa.id} />
          <section className={styles.criterioCliente} aria-label="Critério enviado ao cliente">
            <span>O cliente vai conferir</span>
            <strong>{guiaValidacao.criterio}</strong>
            <small>Material: {guiaValidacao.material}</small>
          </section>
          <label>
            <span>E-mail que receberá a validação</span>
            <input
              type="email"
              name="email"
              defaultValue={clienteEmail ?? ''}
              maxLength={320}
              autoComplete="email"
              required={concluida}
              placeholder="cliente@empresa.com.br"
            />
          </label>
          <label>
            <span>Mensagem para o cliente</span>
            <textarea
              name="nota"
              defaultValue={tarefa.clienteNota ?? guiaValidacao.mensagemCliente}
              maxLength={4000}
              placeholder={
                aceiteFinal
                  ? 'Resuma o resultado entregue, os materiais finais e como a operação continua.'
                  : 'Diga o que foi concluído e qual resultado o cliente deve conferir.'
              }
            />
          </label>
          <label>
            <span>Link compartilhável do entregável</span>
            <input
              type="url"
              name="url"
              defaultValue={tarefa.entregavelUrl ?? ''}
              maxLength={2048}
              placeholder="https://"
            />
          </label>

          <p className={styles.privacidade}>
            {aceiteFinal
              ? 'O aceite do cliente conclui formalmente o projeto. Sua evidência interna continua privada.'
              : 'A evidência interna continua privada. O cliente vê somente a mensagem e o material compartilhado.'}
          </p>

          {!portalAtivo && concluida && (
            <a className={styles.portalPendente} href="#portal-cliente">
              Ative o portal para enviar esta validação
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          )}

          {estado.erro && <p role="alert">{estado.erro}</p>}
          {estado.sucesso && <p role="status">{estado.sucesso}</p>}
          {estado.aviso && (
            <p className={styles.aviso} role="alert">
              {estado.aviso}
            </p>
          )}

          <div className={styles.acoes}>
            <button type="submit" name="operacao" value="salvar" disabled={pendente}>
              {pendente ? 'Salvando…' : 'Salvar mensagem'}
            </button>
            {concluida ? (
              <button
                type="submit"
                name="operacao"
                value="solicitar"
                disabled={pendente || !portalAtivo || (aceiteFinal && !encerramentoPronto)}
                className={styles.enviar}
              >
                <Send size={14} aria-hidden="true" />{' '}
                {pendente
                  ? 'Enviando…'
                  : aceiteFinal
                    ? encerramentoPronto
                      ? 'Solicitar aceite final'
                      : 'Prepare o encerramento acima'
                    : 'Enviar para validação'}
              </button>
            ) : (
              <span>Conclua os ajustes para reenviar.</span>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

function NotificacaoCliente({
  projetoId,
  notificacao,
  lembrete,
  email,
  estado,
  reenviando,
  action,
}: {
  projetoId: string;
  notificacao: EventoProjetoExecucao | null;
  lembrete: EventoProjetoExecucao | null;
  email: string | null;
  estado: EstadoProjetoExecucao;
  reenviando: boolean;
  action: (formData: FormData) => void;
}) {
  const status = notificacao?.emailStatus ?? 'nao_solicitado';
  const concluida = status === 'entregue';
  const emTransito = ['enviando', 'enviado', 'atrasado'].includes(status);
  const titulo = concluida
    ? 'E-mail entregue ao cliente'
    : status === 'enviado'
      ? 'E-mail enviado ao cliente'
      : status === 'enviando'
        ? 'Enviando o aviso por e-mail'
        : status === 'atrasado'
          ? 'A entrega do e-mail está demorando'
          : status === 'devolvido'
            ? 'O endereço recusou o e-mail'
            : 'O aviso por e-mail não foi entregue';
  const descricao = concluida
    ? `O provedor confirmou a entrega em ${notificacao?.emailDestinatario}.`
    : emTransito
      ? status === 'atrasado'
        ? 'O provedor continuará tentando. A validação já está disponível no portal.'
        : `A validação foi enviada para ${notificacao?.emailDestinatario ?? email}.`
      : 'A validação continua segura no portal. Corrija o endereço, se necessário, e tente novamente.';

  return (
    <section className={styles.notificacao} data-status={status} aria-live="polite">
      <span className={styles.notificacaoIcone}>
        {concluida || emTransito ? (
          <MailCheck size={17} aria-hidden="true" />
        ) : (
          <MailWarning size={17} aria-hidden="true" />
        )}
      </span>
      <div>
        <strong>{titulo}</strong>
        <p>{descricao}</p>
        {lembrete ? <StatusLembrete lembrete={lembrete} /> : null}
        {!lembrete && (concluida || emTransito) ? (
          <p className={styles.lembretePrevisto}>
            <BellRing size={14} aria-hidden="true" /> Se ainda faltar a resposta, enviaremos um
            único lembrete após 48 horas.
          </p>
        ) : null}
      </div>
      {!concluida && !emTransito && notificacao && (
        <form action={action} className={styles.reenvio}>
          <input type="hidden" name="projeto" value={projetoId} />
          <input type="hidden" name="evento" value={notificacao.id} />
          <label>
            <span>Novo endereço</span>
            <input
              type="email"
              name="email"
              defaultValue={notificacao.emailDestinatario ?? email ?? ''}
              maxLength={320}
              required
              aria-label="E-mail para reenviar a validação"
            />
          </label>
          <button type="submit" disabled={reenviando}>
            <RefreshCw size={14} aria-hidden="true" />
            {reenviando ? 'Tentando…' : 'Tentar novamente'}
          </button>
          {estado.erro && <p role="alert">{estado.erro}</p>}
          {estado.sucesso && <p role="status">{estado.sucesso}</p>}
        </form>
      )}
    </section>
  );
}

function StatusLembrete({ lembrete }: { lembrete: EventoProjetoExecucao }) {
  const falhou = ['nao_solicitado', 'falhou', 'devolvido', 'reclamado', 'suprimido'].includes(
    lembrete.emailStatus ?? '',
  );
  const entregue = lembrete.emailStatus === 'entregue';
  const preparando = lembrete.emailStatus === 'enviando';

  return (
    <p className={styles.lembreteEnviado} data-falhou={falhou || undefined}>
      <BellRing size={14} aria-hidden="true" />
      {falhou
        ? 'O lembrete não saiu. A entrega continua disponível no portal.'
        : entregue
          ? 'Lembrete entregue ao cliente.'
          : preparando
            ? 'Preparando o lembrete ao cliente.'
            : 'Lembrete enviado ao cliente.'}
    </p>
  );
}

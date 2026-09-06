'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { useFormularioEntrega } from '@/lib/projetos-execucao/use-formulario-entrega';
import { tituloEmail } from '@/lib/notificacoes/estado-email';
import { RetornoOperacao } from '../../_components/RetornoOperacao';
import type { EventoProjetoExecucao, TarefaProjetoExecucao } from '@/lib/projetos-execucao/queries';
import { ROTULO_STATUS_CLIENTE } from '@/lib/projetos-execucao/status';
import { montarGuiaValidacaoTarefa } from '@/lib/projetos-execucao/validacao-tarefa';
import styles from './EntregaCliente.module.css';

export function EntregaCliente({
  projetoId,
  tarefa,
  portalAtivo,
  clienteEmail,
  notificacao,
  lembrete,
  aceiteFinal = false,
  encerramentoPronto = true,
  onAbrirPortal,
}: {
  projetoId: string;
  tarefa: TarefaProjetoExecucao;
  portalAtivo: boolean;
  clienteEmail: string | null;
  notificacao: EventoProjetoExecucao | null;
  lembrete: EventoProjetoExecucao | null;
  aceiteFinal?: boolean;
  encerramentoPronto?: boolean;
  onAbrirPortal?: () => void;
}) {
  const { estado, enviar, editar, pendente, bloqueado, operacao } =
    useFormularioEntrega(prepararEntregaCliente);
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
        <form onSubmit={enviar} onChange={editar} aria-busy={pendente || undefined}>
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
              disabled={pendente}
              placeholder="cliente@empresa.com.br"
            />
          </label>
          <label>
            <span>Mensagem para o cliente</span>
            <textarea
              name="nota"
              defaultValue={tarefa.clienteNota ?? guiaValidacao.mensagemCliente}
              maxLength={4000}
              disabled={pendente}
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
              disabled={pendente}
              placeholder="https://"
            />
          </label>

          <p className={styles.privacidade}>
            {aceiteFinal
              ? 'O aceite do cliente conclui formalmente o projeto. Sua evidência interna continua privada.'
              : 'A evidência interna continua privada. O cliente vê somente a mensagem e o material compartilhado.'}
          </p>

          {!portalAtivo && concluida && (
            <button
              type="button"
              className={styles.portalPendente}
              onClick={onAbrirPortal}
              disabled={!onAbrirPortal}
            >
              Ative o portal para enviar esta validação
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}

          {estado.erro && (
            <RetornoOperacao tom="erro" titulo="Envio não confirmado" descricao={estado.erro} />
          )}
          {estado.sucesso && <RetornoOperacao tom="sucesso" titulo={estado.sucesso} />}
          {estado.aviso && (
            <p className={styles.aviso} role="alert">
              {estado.aviso}
            </p>
          )}

          <div className={styles.acoes}>
            <button type="submit" name="operacao" value="salvar" disabled={bloqueado}>
              {pendente && operacao === 'salvar' ? 'Salvando…' : 'Salvar mensagem'}
            </button>
            {concluida ? (
              <button
                type="submit"
                name="operacao"
                value="solicitar"
                disabled={bloqueado || !portalAtivo || (aceiteFinal && !encerramentoPronto)}
                className={styles.enviar}
              >
                <Send size={14} aria-hidden="true" />{' '}
                {pendente && operacao === 'solicitar'
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
}: {
  projetoId: string;
  notificacao: EventoProjetoExecucao | null;
  lembrete: EventoProjetoExecucao | null;
  email: string | null;
}) {
  const router = useRouter();
  const [atualizando, atualizar] = useTransition();
  const {
    estado,
    enviar,
    editar,
    pendente: reenviando,
    bloqueado,
  } = useFormularioEntrega(reenviarNotificacaoEntregaCliente);
  const status = notificacao?.emailStatus ?? 'nao_solicitado';
  const concluida = status === 'entregue';
  const emTransito = ['enviando', 'enviado', 'atrasado'].includes(status);
  const recuperacao =
    notificacao?.emailRecuperacao ??
    (concluida || emTransito
      ? 'nenhuma'
      : ['reclamado', 'suprimido'].includes(status)
        ? 'bloqueado'
        : 'tentar');
  const podeRecuperar = ['tentar', 'corrigir', 'verificar'].includes(recuperacao);
  const descricao = concluida
    ? `Recebido pelo servidor de ${notificacao?.emailDestinatario}. Não confirma leitura.`
    : emTransito
      ? status === 'atrasado'
        ? 'O provedor continuará tentando. Não é necessário reenviar.'
        : `Destino: ${notificacao?.emailDestinatario ?? email ?? 'cliente'}. Aguardando confirmação de entrega.`
      : recuperacao === 'bloqueado'
        ? 'Compartilhe o link do portal. Novos envios estão pausados para sua segurança.'
        : recuperacao === 'verificar'
          ? 'Confira o envio anterior sem criar outro e-mail.'
          : status === 'devolvido'
            ? 'Informe outro endereço para enviar o aviso.'
            : 'A validação está no portal. Você pode tentar enviar o aviso novamente.';

  return (
    <section className={styles.notificacao} data-status={status} aria-live="polite">
      <span className={styles.notificacaoIcone}>
        {concluida ? (
          <MailCheck size={17} aria-hidden="true" />
        ) : emTransito ? (
          <Clock3 size={17} aria-hidden="true" />
        ) : (
          <MailWarning size={17} aria-hidden="true" />
        )}
      </span>
      <div>
        <strong>{tituloEmail(status)}</strong>
        <p>{descricao}</p>
        {lembrete ? <StatusLembrete lembrete={lembrete} /> : null}
        {!lembrete && (concluida || emTransito) ? (
          <p className={styles.lembretePrevisto}>
            <BellRing size={14} aria-hidden="true" /> Se ainda faltar a resposta, enviaremos um
            único lembrete após 48 horas.
          </p>
        ) : null}
      </div>
      {emTransito && recuperacao === 'nenhuma' && (
        <button
          type="button"
          className={styles.atualizarStatus}
          disabled={atualizando}
          onClick={() => atualizar(() => router.refresh())}
        >
          <RefreshCw size={14} aria-hidden="true" />
          {atualizando ? 'Atualizando…' : 'Atualizar status'}
        </button>
      )}
      {podeRecuperar && notificacao && (
        <form
          onSubmit={enviar}
          onChange={editar}
          className={styles.reenvio}
          aria-busy={reenviando || undefined}
        >
          <input type="hidden" name="projeto" value={projetoId} />
          <input type="hidden" name="evento" value={notificacao.id} />
          <label>
            <span>{recuperacao === 'verificar' ? 'Endereço do envio' : 'Enviar para'}</span>
            <input
              type="email"
              name="email"
              readOnly={recuperacao === 'verificar'}
              disabled={reenviando}
              defaultValue={notificacao.emailDestinatario ?? email ?? ''}
              maxLength={320}
              required
              aria-label="E-mail para reenviar a validação"
            />
          </label>
          <button type="submit" disabled={bloqueado}>
            <RefreshCw size={14} aria-hidden="true" />
            {reenviando
              ? 'Conferindo…'
              : recuperacao === 'verificar'
                ? 'Verificar envio'
                : 'Tentar novamente'}
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
        ? 'Envio do lembrete não confirmado. A entrega continua no portal.'
        : entregue
          ? 'Lembrete entregue ao cliente.'
          : preparando
            ? 'Preparando o lembrete ao cliente.'
            : 'Lembrete enviado ao cliente.'}
    </p>
  );
}

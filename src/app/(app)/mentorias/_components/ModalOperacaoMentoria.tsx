'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Alert, Button, Spinner } from '@/design-system/via';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { Visto } from '../../_components/PillEstado';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './ModalOperacaoMentoria.module.css';

export type FaseOperacaoMentoria = 'confirmacao' | 'processando' | 'sucesso' | 'erro';

export function ModalOperacaoMentoria({
  tipo,
  sessao,
  fase,
  falha,
  saldoAtual,
  agora,
  aoFechar,
  aoConfirmar,
}: {
  tipo: 'checkin' | 'cancelamento';
  sessao: SessaoMentoria | null;
  fase: FaseOperacaoMentoria;
  falha: string | null;
  saldoAtual: number | null;
  agora: Date;
  aoFechar: () => void;
  aoConfirmar: () => void;
}) {
  const cancelamento = tipo === 'cancelamento';
  const movimento = sessao
    ? cancelamento
      ? (sessao.creditosUsados ?? sessao.custoCreditos)
      : sessao.custoCreditos
    : 0;
  const saldoDepois =
    saldoAtual === null ? null : saldoAtual + (cancelamento ? movimento : -movimento);
  const saldoInsuficiente = !cancelamento && saldoDepois !== null && saldoDepois < 0;
  const titulo =
    fase === 'processando'
      ? cancelamento
        ? 'Cancelando check-in'
        : 'Confirmando seu check-in'
      : fase === 'sucesso'
        ? cancelamento
          ? 'Check-in cancelado'
          : 'Check-in confirmado'
        : fase === 'erro'
          ? cancelamento
            ? 'Não foi possível cancelar'
            : 'Não foi possível confirmar'
          : cancelamento
            ? 'Cancelar seu check-in?'
            : 'Confirmar check-in';

  const rodape =
    fase === 'processando' ? undefined : (
      <div className={styles.acoes}>
        {fase === 'confirmacao' && saldoInsuficiente ? (
          <>
            <Button variant="secondary" onClick={aoFechar}>
              Fechar
            </Button>
            <Link href="/conta/creditos" className={styles.creditosCta}>
              Ver meus créditos
            </Link>
          </>
        ) : fase === 'confirmacao' ? (
          <>
            <Button variant="secondary" onClick={aoFechar}>
              {cancelamento ? 'Manter check-in' : 'Voltar'}
            </Button>
            <Button
              variant={cancelamento ? 'destructive' : 'primary'}
              iconLeft={
                cancelamento ? <X size={15} strokeWidth={2} aria-hidden="true" /> : undefined
              }
              onClick={aoConfirmar}
            >
              {cancelamento
                ? 'Cancelar check-in'
                : `Usar ${movimento} ${movimento === 1 ? 'crédito' : 'créditos'} e confirmar`}
            </Button>
          </>
        ) : fase === 'erro' ? (
          <>
            <Button variant="secondary" onClick={aoFechar}>
              Fechar
            </Button>
            <Button variant="primary" onClick={aoConfirmar}>
              Tentar novamente
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={aoFechar}>
            Fechar
          </Button>
        )}
      </div>
    );

  return (
    <ModalOperacao
      open={sessao !== null}
      onClose={aoFechar}
      title={titulo}
      size="sm"
      hideClose={fase === 'processando'}
      footer={rodape}
    >
      {sessao && fase === 'confirmacao' ? (
        <div className={styles.confirmacao}>
          <p className={styles.texto}>
            {cancelamento ? (
              <>
                Sua vaga será liberada e {movimento}{' '}
                {movimento === 1 ? 'crédito voltará' : 'créditos voltarão'} para o seu saldo.
              </>
            ) : (
              <>
                Confirme sua vaga em “{sessao.titulo}” (
                {rotuloDoDia(sessao.inicioIso, agora).principal.toLowerCase()},{' '}
                {horaCurta(sessao.inicioIso)}). O valor só é usado depois da confirmação.
              </>
            )}
          </p>

          <div className={styles.saldo} aria-label="Resumo de créditos">
            <span>
              <small>Saldo atual</small>
              <strong>{saldoAtual === null ? '—' : saldoAtual}</strong>
            </span>
            <span>
              <small>{cancelamento ? 'Devolução' : 'Custo'}</small>
              <strong>
                {cancelamento ? '+' : '−'}
                {movimento}
              </strong>
            </span>
            <span data-destaque>
              <small>Saldo depois</small>
              <strong>{saldoDepois === null ? '—' : Math.max(0, saldoDepois)}</strong>
            </span>
          </div>

          {saldoInsuficiente ? (
            <Alert tone="danger" size="compact" title="Faltam créditos para este check-in">
              Seu saldo é {saldoAtual ?? 0} e esta sessão usa {movimento}. Confira os pacotes
              disponíveis antes de reservar a vaga.
            </Alert>
          ) : null}
        </div>
      ) : null}

      {sessao && fase === 'processando' ? (
        <div className={styles.estado} aria-live="polite">
          <Spinner
            size="lg"
            label={cancelamento ? 'Devolvendo sua vaga e seus créditos…' : 'Reservando sua vaga…'}
          />
          <p>
            {cancelamento
              ? 'Espere só um momento. Esta janela fecha quando a atualização terminar.'
              : 'Estamos confirmando a vaga e atualizando seu saldo de créditos.'}
          </p>
        </div>
      ) : null}

      {sessao && fase === 'sucesso' ? (
        <div className={styles.estado} data-estado="sucesso" role="status">
          <span className={styles.icone} aria-hidden="true">
            <Visto tamanho={18} />
          </span>
          <p>
            {cancelamento ? (
              <>
                Sua vaga foi liberada e {movimento}{' '}
                {movimento === 1 ? 'crédito voltou' : 'créditos voltaram'} para o saldo. Saldo
                atual: {saldoAtual ?? '—'}.
              </>
            ) : (
              <>
                Sua vaga em “{sessao.titulo}” está confirmada. A sala aparece aqui quando a sessão
                começar.
              </>
            )}
          </p>
        </div>
      ) : null}

      {fase === 'erro' && falha ? (
        <Alert
          tone="danger"
          size="compact"
          title={cancelamento ? 'O check-in continua ativo' : 'Nenhum crédito foi usado'}
        >
          {falha}
        </Alert>
      ) : null}
    </ModalOperacao>
  );
}

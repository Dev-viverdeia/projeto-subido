'use client';

import { X } from 'lucide-react';
import { Alert, Button, Modal, Spinner } from '@/design-system/via';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { Visto } from '../../_components/PillEstado';
import { horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './ModalOperacaoMentoria.module.css';

export type FaseOperacaoMentoria = 'confirmacao' | 'processando' | 'sucesso' | 'erro';

export function ModalOperacaoMentoria({
  tipo,
  sessao,
  fase,
  falha,
  agora,
  aoFechar,
  aoConfirmar,
}: {
  tipo: 'checkin' | 'cancelamento';
  sessao: SessaoMentoria | null;
  fase: FaseOperacaoMentoria;
  falha: string | null;
  agora: Date;
  aoFechar: () => void;
  aoConfirmar: () => void;
}) {
  const cancelamento = tipo === 'cancelamento';
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
        {fase === 'confirmacao' ? (
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
                : `Confirmar por ${sessao?.custoCreditos ?? 0} ${(sessao?.custoCreditos ?? 0) === 1 ? 'crédito' : 'créditos'}`}
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
    <Modal
      open={sessao !== null}
      onClose={aoFechar}
      title={titulo}
      size="sm"
      hideClose={fase === 'processando'}
      footer={rodape}
    >
      {sessao && fase === 'confirmacao' ? (
        <p className={styles.texto}>
          {cancelamento ? (
            <>
              Sua vaga em “{sessao.titulo}” volta a ficar disponível e os {sessao.custoCreditos}{' '}
              créditos usados retornam ao seu saldo. Você poderá fazer um novo check-in depois,
              enquanto ainda houver vaga.
            </>
          ) : (
            <>
              O check-in usa {sessao.custoCreditos}{' '}
              {sessao.custoCreditos === 1 ? 'crédito' : 'créditos'} e garante sua vaga em “
              {sessao.titulo}” ({rotuloDoDia(sessao.inicioIso, agora).principal.toLowerCase()},{' '}
              {horaCurta(sessao.inicioIso)}). Você pode cancelar até o início. Nesse caso, a vaga
              volta a ficar disponível.
            </>
          )}
        </p>
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
                Sua vaga foi liberada e {sessao.custoCreditos}{' '}
                {sessao.custoCreditos === 1 ? 'crédito voltou' : 'créditos voltaram'} para o saldo.
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
    </Modal>
  );
}

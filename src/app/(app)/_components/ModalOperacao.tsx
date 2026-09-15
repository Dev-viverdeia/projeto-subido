'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/design-system/via';
import styles from './ModalOperacao.module.css';

type TamanhoModal = 'sm' | 'md' | 'lg' | 'xl';

const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;

/**
 * Modal operacional da plataforma.
 *
 * O portal garante que o diálogo seja ancorado à viewport, mesmo quando o
 * gatilho vive dentro de um card animado. O componente vendorizado continua
 * responsável por foco, Escape e bloqueio do scroll; esta camada define a
 * anatomia, a superfície e o comportamento responsivo do produto.
 */
export function ModalOperacao({
  open,
  onClose,
  label,
  title,
  description,
  size = 'md',
  children,
  footer,
  hideClose = false,
  blocked = false,
}: {
  open: boolean;
  onClose: () => void;
  label?: string;
  title: string;
  description?: string;
  size?: TamanhoModal;
  children?: ReactNode;
  footer?: ReactNode;
  hideClose?: boolean;
  blocked?: boolean;
}) {
  const portal = useRef<HTMLDivElement>(null);
  const escapeDoControle = useRef(false);
  const descricaoId = useId();
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );

  useLayoutEffect(() => {
    if (!open || !montado) return;
    const focoAnterior = document.activeElement as HTMLElement | null;
    return () => {
      // O vendor restaura o foco antes de o efeito que isola o fundo terminar.
      // Espera a liberação de inert, sem disputar foco com outra ação do usuário.
      window.requestAnimationFrame(() => {
        if (
          document.activeElement === document.body &&
          focoAnterior?.isConnected &&
          !focoAnterior.closest('[inert]')
        ) {
          focoAnterior.focus({ preventScroll: true });
        }
      });
    };
  }, [open, montado]);

  useEffect(() => {
    if (!open || !montado) return;
    const superficies = Array.from(document.querySelectorAll<HTMLElement>('[data-app-shell]'));
    const estadosInert = superficies.map((superficie) => superficie.hasAttribute('inert'));
    superficies.forEach((superficie) => superficie.setAttribute('inert', ''));
    const quadro = window.requestAnimationFrame(() => {
      portal.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    });
    return () => {
      window.cancelAnimationFrame(quadro);
      superficies.forEach((superficie, indice) => {
        if (!estadosInert[indice]) superficie.removeAttribute('inert');
      });
    };
  }, [open, montado]);

  useEffect(() => {
    if (!open || !montado) return;
    // O vendor não expõe aria-describedby. Relaciona a descrição que já está
    // visível, sem duplicar a copy ou alterar o componente gerado.
    const dialogo = portal.current?.querySelector('[role="dialog"]');
    const descricao = portal.current?.querySelector('.via-modal__head p');
    if (description && descricao) {
      descricao.id = descricaoId;
      dialogo?.setAttribute('aria-describedby', descricaoId);
    } else {
      dialogo?.removeAttribute('aria-describedby');
    }
  }, [open, montado, description, descricaoId]);

  if (!montado || !open) return null;

  const fechar = () => {
    const preservarControle = escapeDoControle.current;
    escapeDoControle.current = false;
    if (!blocked && !preservarControle) onClose();
  };

  return createPortal(
    <div
      ref={portal}
      className={styles.portal}
      data-app-modal
      data-size={size}
      data-has-label={Boolean(label)}
      data-label={label}
      data-blocked={blocked}
      onKeyDownCapture={(evento) => {
        // Select/Combobox do vendor também tratam Escape no document. Sem
        // esta guarda, uma tecla fecha a lista E descarta o formulário.
        escapeDoControle.current =
          evento.key === 'Escape' &&
          Boolean(
            portal.current?.querySelector(
              '[aria-haspopup][aria-expanded="true"], [role="combobox"][aria-expanded="true"]',
            ),
          );
      }}
      onClickCapture={() => {
        escapeDoControle.current = false;
      }}
      style={label ? ({ '--app-modal-label': `"${label}"` } as CSSProperties) : undefined}
    >
      <Modal
        open
        onClose={fechar}
        title={title}
        description={description}
        size={size === 'xl' ? 'lg' : size}
        footer={footer}
        hideClose={hideClose || blocked}
      >
        <div className={styles.corpo}>{children}</div>
      </Modal>
    </div>,
    document.body,
  );
}

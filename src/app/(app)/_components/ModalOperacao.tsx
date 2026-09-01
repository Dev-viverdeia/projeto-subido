'use client';

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
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
  title: string;
  description?: string;
  size?: TamanhoModal;
  children?: ReactNode;
  footer?: ReactNode;
  hideClose?: boolean;
  blocked?: boolean;
}) {
  const portal = useRef<HTMLDivElement>(null);
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );

  useEffect(() => {
    if (!open) return;
    const quadro = window.requestAnimationFrame(() => {
      portal.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    });
    return () => window.cancelAnimationFrame(quadro);
  }, [open]);

  if (!montado || !open) return null;

  const fechar = () => {
    if (!blocked) onClose();
  };

  return createPortal(
    <div ref={portal} className={styles.portal} data-size={size}>
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

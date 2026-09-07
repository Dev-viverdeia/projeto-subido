'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { DropdownMenuGroup } from '@/design-system/via';
import styles from './AcoesOportunidade.module.css';

/** Top layer nativa: não é recortado pelos cards glass ou pelo kanban. */
export function MenuAcoesVenda({
  grupos,
  rotulo,
  compacto,
  disabled,
}: {
  grupos: DropdownMenuGroup[];
  rotulo: string;
  compacto: boolean;
  disabled: boolean;
}) {
  const id = useId();
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  function posicionar() {
    const ancora = gatilho.current?.getBoundingClientRect();
    const menu = painel.current;
    if (!ancora || !menu) return;
    const largura = menu.offsetWidth;
    const altura = menu.offsetHeight;
    menu.style.left = `${Math.max(12, Math.min(ancora.right - largura, window.innerWidth - largura - 12))}px`;
    menu.style.top = `${Math.max(12, Math.min(ancora.bottom + 8, window.innerHeight - altura - 12))}px`;
  }
  useEffect(() => {
    if (!aberto) return;
    const fecharAoRolar = (evento: Event) => {
      if (!painel.current?.contains(evento.target as Node)) painel.current?.hidePopover();
    };
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', fecharAoRolar, true);
    return () => {
      window.removeEventListener('resize', posicionar);
      window.removeEventListener('scroll', fecharAoRolar, true);
    };
  }, [aberto]);
  function fechar() {
    painel.current?.hidePopover();
    gatilho.current?.focus();
  }
  return (
    <>
      <button
        ref={gatilho}
        type="button"
        popoverTarget={id}
        onClick={(evento) => {
          evento.preventDefault();
          const menu = painel.current;
          if (!menu) return;
          if (menu.matches(':popover-open')) {
            fechar();
            return;
          }
          menu.showPopover();
          posicionar();
          menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
        }}
        className={styles.gatilho}
        disabled={disabled}
        aria-label={rotulo}
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        <MoreHorizontal size={20} aria-hidden="true" />
        {!compacto && 'Mais ações'}
      </button>
      <div
        ref={painel}
        id={id}
        popover="auto"
        role="menu"
        aria-label={rotulo}
        className={styles.menu}
        onToggle={(evento) => setAberto(evento.newState === 'open')}
        onKeyDown={(evento) => {
          if (evento.key === 'Escape' || evento.key === 'Tab') {
            fechar();
            return;
          }
          const botoes = Array.from(
            painel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
          );
          const indice = botoes.indexOf(document.activeElement as HTMLButtonElement);
          const destino =
            evento.key === 'ArrowDown'
              ? (indice + 1) % botoes.length
              : evento.key === 'ArrowUp'
                ? (indice - 1 + botoes.length) % botoes.length
                : evento.key === 'Home'
                  ? 0
                  : evento.key === 'End'
                    ? botoes.length - 1
                    : -1;
          if (destino >= 0) {
            evento.preventDefault();
            botoes[destino]?.focus();
          }
        }}
      >
        {grupos.map((grupo) => (
          <div key={grupo.id} role="group" className={styles.grupo}>
            {grupo.label && <span className={styles.rotuloGrupo}>{grupo.label}</span>}
            {grupo.items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled || disabled}
                onClick={() => {
                  fechar();
                  item.onSelect?.();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

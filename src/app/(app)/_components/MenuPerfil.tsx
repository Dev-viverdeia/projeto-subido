'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Avatar } from '@/design-system/via';
import { sair } from '@/lib/auth/actions';
import styles from './MenuPerfil.module.css';

/**
 * Identidade e saída, no canto direito do cabeçalho.
 *
 * POR QUE NÃO É O `DropdownMenu` DO DESIGN SYSTEM
 * O componente vendorizado recebe os itens como dados (`{ label, onSelect }`) e os
 * renderiza como `<button>`. Isso custaria duas coisas que aqui importam:
 *
 *   · "Minha conta" deixaria de ser um link de verdade. Sem `<a href>` não há
 *     cmd+clique, abrir em nova aba, copiar endereço, nem prefetch do Next.
 *   · "Sair" viraria um `onSelect` no cliente. Hoje é `<form action={sair}>`, que
 *     funciona sem JavaScript e é POST — e logout PRECISA ser POST: um `<a>` seria
 *     disparado por prefetch de link ou por scanner de antivírus, deslogando a
 *     pessoa sozinha.
 *
 * O DS é vendorizado e não se edita, então a saída certa é este componente local —
 * exatamente o que o CLAUDE.md prescreve: a seção ganha `'use client'`, não o DS.
 *
 * O teclado segue o padrão de menu: Escape fecha e devolve o foco ao gatilho, clique
 * fora fecha, e o menu inteiro é um grupo navegável por Tab (são dois itens; roving
 * tabindex seria cerimônia sem ganho).
 */
export function MenuPerfil({ nome, email }: { nome: string; email: string }) {
  const [aberto, setAberto] = useState(false);
  const idMenu = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setAberto(false);
      /* Devolver o foco é o que impede o teclado de ser jogado para o topo da
         página quando o painel some — o elemento focado deixa de existir. */
      gatilho.current?.focus();
    }

    function aoApontar(e: PointerEvent) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }

    document.addEventListener('keydown', aoTeclar);
    /* `pointerdown` e não `click`: fechar só no clique deixaria o painel aberto
       durante todo o arrasto de uma seleção de texto iniciada fora dele. */
    document.addEventListener('pointerdown', aoApontar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoApontar);
    };
  }, [aberto]);

  return (
    <div className={styles.raiz} ref={raiz}>
      <button
        ref={gatilho}
        type="button"
        className={styles.gatilho}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-controls={aberto ? idMenu : undefined}
        onClick={() => setAberto((v) => !v)}
      >
        <Avatar alt={nome} size="sm" aria-hidden="true" />
        <span className={styles.nomeGatilho}>{nome}</span>
        <ChevronDown
          size={15}
          strokeWidth={1.8}
          className={styles.seta}
          data-aberto={aberto || undefined}
          aria-hidden="true"
        />
      </button>

      {aberto && (
        <div className={styles.painel} id={idMenu} role="menu">
          <div className={styles.identidade}>
            <span className={styles.nome}>{nome}</span>
            <span className={styles.email}>{email}</span>
          </div>

          <div className={styles.itens}>
            <Link
              href="/conta"
              role="menuitem"
              className={styles.item}
              onClick={() => setAberto(false)}
            >
              <UserRound size={16} strokeWidth={1.8} aria-hidden="true" />
              Minha conta
            </Link>

            <form action={sair}>
              <button type="submit" role="menuitem" className={styles.item}>
                <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

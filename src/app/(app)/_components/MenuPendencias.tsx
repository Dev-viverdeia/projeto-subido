'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, ChevronRight } from 'lucide-react';
import type { PendenciaEntrega } from '@/lib/projetos-execucao/alertas';
import styles from './MenuPendencias.module.css';

const LIMITE_VISIVEL = 5;

export function MenuPendencias({ pendencias }: { pendencias: PendenciaEntrega[] }) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  const idTitulo = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const primeiroItem = useRef<HTMLAnchorElement>(null);
  const focarAoAbrir = useRef(false);

  useEffect(() => {
    if (!aberto || !focarAoAbrir.current) return;
    focarAoAbrir.current = false;
    primeiroItem.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return;
      setAberto(false);
      gatilho.current?.focus();
    }

    function aoApontar(evento: PointerEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false);
    }

    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoApontar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoApontar);
    };
  }, [aberto]);

  if (pendencias.length === 0) return null;

  const visiveis = pendencias.slice(0, LIMITE_VISIVEL);
  const restantes = Math.max(pendencias.length - visiveis.length, 0);

  function abrirComFoco() {
    focarAoAbrir.current = true;
    setAberto(true);
  }

  return (
    <div className={styles.raiz} ref={raiz}>
      <button
        ref={gatilho}
        type="button"
        className={styles.gatilho}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-controls={aberto ? idPainel : undefined}
        aria-label={`${pendencias.length} ${pendencias.length === 1 ? 'pendência de entrega' : 'pendências de entrega'}`}
        onClick={() => setAberto((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key !== 'ArrowDown') return;
          evento.preventDefault();
          abrirComFoco();
        }}
      >
        <Bell size={16} strokeWidth={1.8} aria-hidden="true" />
        <span className={styles.rotuloGatilho}>Pendências</span>
        <strong className={styles.contagem}>{pendencias.length}</strong>
      </button>

      {aberto ? (
        <section className={styles.painel} id={idPainel} role="dialog" aria-labelledby={idTitulo}>
          <header className={styles.cabecalhoPainel}>
            <span className={styles.sobretitulo}>Entregas</span>
            <strong id={idTitulo}>O que precisa de atenção</strong>
            <p>Os avisos somem assim que cada situação é resolvida.</p>
          </header>

          <div className={styles.lista}>
            {visiveis.map((pendencia, indice) => (
              <Link
                key={pendencia.id}
                ref={indice === 0 ? primeiroItem : undefined}
                href={pendencia.href}
                className={styles.item}
                onClick={() => setAberto(false)}
              >
                <span className={styles.indice} aria-hidden="true">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <span className={styles.textosItem}>
                  <strong>{pendencia.motivo}</strong>
                  <span>{pendencia.empresa}</span>
                  <small>{pendencia.detalhe}</small>
                </span>
                <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            ))}
          </div>

          <footer className={styles.rodapePainel}>
            <span>
              {restantes > 0
                ? `Mais ${restantes} ${restantes === 1 ? 'pendência' : 'pendências'}`
                : 'Lista atualizada pelo andamento dos projetos'}
            </span>
            <Link href="/entregas" onClick={() => setAberto(false)}>
              Ver entregas
              <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </footer>
        </section>
      ) : null}
    </div>
  );
}

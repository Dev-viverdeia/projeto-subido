'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Check, CircleAlert, Coins, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/design-system/via';
import styles from './ResultadoBusca.module.css';

const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;

type ResultadoBuscaProps = {
  estado: 'concluida' | 'falhou';
  segmento: string;
  localizacao: string;
  solicitadas: number;
  encontradas: number;
};

export function ResultadoBusca({
  estado,
  segmento,
  localizacao,
  solicitadas,
  encontradas,
}: ResultadoBuscaProps) {
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );
  const router = useRouter();
  const painel = useRef<HTMLElement>(null);
  const acaoPrincipal = useRef<HTMLButtonElement>(null);
  const falhou = estado === 'falhou';

  const fechar = (destino?: 'formulario' | 'resultados') => {
    const url = new URL(window.location.href);
    url.searchParams.delete('busca');
    router.replace(`${url.pathname}${url.search}`);
    window.setTimeout(() => {
      const alvo = document.getElementById(
        destino === 'formulario' ? 'prospeccao-segmento' : 'lista-resultados',
      );
      alvo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (destino === 'formulario' && alvo instanceof HTMLElement) alvo.focus();
    }, 120);
  };

  useEffect(() => {
    if (!montado) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => acaoPrincipal.current?.focus());
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [montado]);

  if (!montado) return null;

  return createPortal(
    <div className={styles.fundo} data-estado={estado}>
      <section
        ref={painel}
        className={styles.painel}
        role={falhou ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="resultado-busca-titulo"
        aria-describedby="resultado-busca-descricao"
        tabIndex={-1}
        onKeyDown={(evento) => {
          if (evento.key === 'Escape') fechar();
          if (evento.key !== 'Tab') return;
          const elementos = painel.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), [href], input:not(:disabled)',
          );
          if (!elementos?.length) return;
          const primeiro = elementos[0];
          const ultimo = elementos[elementos.length - 1];
          if (evento.shiftKey && document.activeElement === primeiro) {
            evento.preventDefault();
            ultimo?.focus();
          } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primeiro?.focus();
          }
        }}
      >
        <div className={styles.atmosfera} aria-hidden="true" />
        <div className={styles.icone} aria-hidden="true">
          {falhou ? <CircleAlert size={28} /> : <Check size={28} />}
        </div>

        <div className={styles.conteudo}>
          <p>{falhou ? 'Busca encerrada' : 'Busca concluída'}</p>
          <h2 id="resultado-busca-titulo">
            {falhou ? 'Não conseguimos montar esta lista.' : 'Sua lista está pronta.'}
          </h2>
          <span id="resultado-busca-descricao">
            {falhou
              ? 'Uma das fontes demorou mais do que o limite seguro. Nada foi cobrado.'
              : `${encontradas} ${encontradas === 1 ? 'empresa encontrada' : 'empresas encontradas'} e organizadas para você começar.`}
          </span>
        </div>

        <div className={styles.resumo}>
          <span>
            <Search size={16} aria-hidden="true" />
            <span>
              <small>Busca</small>
              <strong>
                {segmento} em {localizacao}
              </strong>
            </span>
          </span>
          <span>
            {falhou ? (
              <Coins size={16} aria-hidden="true" />
            ) : (
              <Check size={16} aria-hidden="true" />
            )}
            <span>
              <small>{falhou ? 'Créditos' : 'Resultado'}</small>
              <strong>
                {falhou
                  ? `${solicitadas} devolvidos ao saldo`
                  : `${encontradas} de ${solicitadas} solicitadas`}
              </strong>
            </span>
          </span>
        </div>

        <footer className={styles.acoes}>
          <Button type="button" variant="ghost" onClick={() => fechar()}>
            Fechar
          </Button>
          <Button
            ref={acaoPrincipal}
            type="button"
            variant="primary"
            iconLeft={falhou ? <RotateCcw size={16} /> : <Search size={16} />}
            onClick={() => fechar(falhou ? 'formulario' : 'resultados')}
          >
            {falhou ? 'Ajustar e tentar de novo' : 'Ver empresas'}
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

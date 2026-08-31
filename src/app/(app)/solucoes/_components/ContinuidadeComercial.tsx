'use client';

import Link from 'next/link';
import { useActionState, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useFormStatus } from 'react-dom';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  LoaderCircle,
  X,
} from 'lucide-react';
import type { EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import { iniciarContinuidadeComercial } from '@/lib/projetos-execucao/evolucao-actions';
import {
  formatarDataEvolucao,
  ROTULO_DECISAO_EVOLUCAO,
  type DecisaoEvolucaoProjeto,
} from '@/lib/projetos-execucao/evolucao';
import styles from './ContinuidadeComercial.module.css';

const INICIAL: EstadoProjetoExecucao = {};
const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;

function ConfirmarContinuacao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.confirmar} disabled={pending}>
      {pending ? (
        <LoaderCircle className={styles.girando} size={16} aria-hidden="true" />
      ) : (
        <BriefcaseBusiness size={16} aria-hidden="true" />
      )}
      {pending ? 'Criando oportunidade…' : 'Criar oportunidade'}
    </button>
  );
}

export function ContinuidadeComercial({
  projetoId,
  empresa,
  decisao,
  proximoPasso,
  proximoPassoEm,
  oportunidadeId,
}: {
  projetoId: string;
  empresa: string;
  decisao: Extract<DecisaoEvolucaoProjeto, 'expandir' | 'novo_projeto'>;
  proximoPasso: string;
  proximoPassoEm: string | null;
  oportunidadeId: string | null;
}) {
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );
  const tituloId = useId();
  const descricaoId = useId();
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [estado, acao] = useActionState(iniciarContinuidadeComercial, INICIAL);

  useEffect(() => {
    if (!aberto || !montado) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const quadro = requestAnimationFrame(() =>
      painel.current?.querySelector<HTMLElement>('button')?.focus(),
    );
    return () => {
      cancelAnimationFrame(quadro);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, montado]);

  function fechar() {
    setAberto(false);
    requestAnimationFrame(() => gatilho.current?.focus());
  }

  if (oportunidadeId) {
    return (
      <Link
        href={`/vendas/${oportunidadeId}?origem=pos-entrega`}
        className={styles.abrirOportunidade}
      >
        <BadgeCheck size={15} aria-hidden="true" />
        Abrir oportunidade em Vendas
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className={styles.gatilho}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
      >
        <BriefcaseBusiness size={15} aria-hidden="true" />
        Levar para Vendas
        <ArrowRight size={15} aria-hidden="true" />
      </button>

      {montado &&
        aberto &&
        createPortal(
          <div
            className={styles.scrim}
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget) fechar();
            }}
          >
            <div
              ref={painel}
              className={styles.dialogo}
              role="dialog"
              aria-modal="true"
              aria-labelledby={tituloId}
              aria-describedby={descricaoId}
              onKeyDown={(evento) => {
                if (evento.key === 'Escape') fechar();
                if (evento.key !== 'Tab') return;
                const focaveis = painel.current?.querySelectorAll<HTMLElement>(
                  'button:not([disabled]), a[href]',
                );
                if (!focaveis?.length) return;
                const primeiro = focaveis[0];
                const ultimo = focaveis[focaveis.length - 1];
                if (!primeiro || !ultimo) return;
                if (evento.shiftKey && document.activeElement === primeiro) {
                  evento.preventDefault();
                  ultimo.focus();
                } else if (!evento.shiftKey && document.activeElement === ultimo) {
                  evento.preventDefault();
                  primeiro.focus();
                }
              }}
            >
              <header className={styles.topo}>
                <span className={styles.iconeTopo} aria-hidden="true">
                  <BriefcaseBusiness size={21} />
                </span>
                <div>
                  <p>Próximo ciclo comercial</p>
                  <h2 id={tituloId}>Levar este próximo passo para Vendas?</h2>
                  <span id={descricaoId}>
                    A nova ficha nasce com o contexto que você confirmou nesta entrega.
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.fechar}
                  onClick={fechar}
                  aria-label="Fechar"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </header>

              <div className={styles.conteudo}>
                {estado.erro && (
                  <p className={styles.erro} role="alert">
                    {estado.erro}
                  </p>
                )}

                <dl className={styles.resumo}>
                  <div>
                    <dt>Cliente</dt>
                    <dd>{empresa}</dd>
                  </div>
                  <div>
                    <dt>Decisão</dt>
                    <dd>{ROTULO_DECISAO_EVOLUCAO[decisao]}</dd>
                  </div>
                  <div className={styles.proximoPasso}>
                    <dt>Próximo passo combinado</dt>
                    <dd>{proximoPasso}</dd>
                    {proximoPassoEm && (
                      <small>
                        <CalendarClock size={13} aria-hidden="true" />
                        {formatarDataEvolucao(proximoPassoEm)}
                      </small>
                    )}
                  </div>
                </dl>

                <div className={styles.garantia}>
                  <Check size={17} aria-hidden="true" />
                  <div>
                    <strong>Isso cria apenas uma oportunidade em Vendas.</strong>
                    <span>
                      A entrega atual continua concluída. Um novo projeto só nasce depois que outra
                      proposta for aceita.
                    </span>
                  </div>
                </div>
              </div>

              <form action={acao} className={styles.acoes}>
                <input type="hidden" name="projeto" value={projetoId} />
                <button type="button" className={styles.cancelar} onClick={fechar}>
                  Agora não
                </button>
                <ConfirmarContinuacao />
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { Spinner } from '@/design-system/via';
import styles from './EsperaOperacao.module.css';

export type EtapaEspera = {
  titulo: string;
  descricao: string;
};

const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;

/**
 * Janela compartilhada para operações que exigem espera real.
 *
 * Ela só deve ser usada quando a pessoa não pode continuar naquela jornada até
 * o servidor responder. Processos em segundo plano continuam usando um status
 * compacto no contexto da tela. O último passo nunca é marcado como concluído
 * por tempo: quem encerra a janela é a resposta real da operação.
 */
export function EsperaOperacao({
  aberto,
  rotulo,
  titulo,
  descricao,
  etapas,
  intervalo = 12_000,
  etapaInicial = 0,
  detalhe,
  nota = 'O resultado aparece aqui assim que estiver pronto.',
  mensagemDemora,
  demoraApos = 24_000,
  acaoSecundaria,
}: {
  aberto: boolean;
  rotulo: string;
  titulo: string;
  descricao: string;
  etapas: readonly EtapaEspera[];
  intervalo?: number;
  etapaInicial?: number;
  detalhe?: string;
  nota?: string;
  mensagemDemora?: string;
  demoraApos?: number;
  acaoSecundaria?: { rotulo: string; aoAcionar: () => void };
}) {
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );
  const [etapaAtiva, setEtapaAtiva] = useState(() =>
    Math.min(Math.max(etapaInicial, 0), etapas.length - 1),
  );
  const [demorando, setDemorando] = useState(false);
  const dialogo = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!montado || !aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => dialogo.current?.focus());
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto, montado]);

  useEffect(() => {
    if (!aberto || etapaAtiva >= etapas.length - 1) return;
    const temporizador = window.setTimeout(
      () => setEtapaAtiva((atual) => Math.min(atual + 1, etapas.length - 1)),
      intervalo,
    );
    return () => window.clearTimeout(temporizador);
  }, [aberto, etapaAtiva, etapas.length, intervalo]);

  useEffect(() => {
    if (!aberto || !mensagemDemora) return;
    const temporizador = window.setTimeout(() => setDemorando(true), demoraApos);
    return () => window.clearTimeout(temporizador);
  }, [aberto, demoraApos, mensagemDemora]);

  if (!montado || !aberto || etapas.length === 0) return null;

  const atual = etapas[etapaAtiva] ?? etapas[0]!;

  return createPortal(
    <div className={styles.fundo}>
      <section
        ref={dialogo}
        className={styles.painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="espera-operacao-titulo"
        aria-describedby="espera-operacao-descricao"
        aria-busy="true"
        tabIndex={-1}
        onKeyDown={(evento) => {
          if (evento.key === 'Tab') {
            evento.preventDefault();
            dialogo.current?.focus();
          }
        }}
      >
        <div className={styles.atmosfera} aria-hidden="true" />
        <header className={styles.cabecalho}>
          <span className={styles.spinner} aria-hidden="true">
            <Spinner size="lg" tone="navy" />
          </span>
          <div>
            <p>{rotulo}</p>
            <h2 id="espera-operacao-titulo">{titulo}</h2>
            <span id="espera-operacao-descricao">{descricao}</span>
          </div>
          {detalhe && <small>{detalhe}</small>}
        </header>

        <div className={styles.agora} role="status" aria-live="polite">
          <span>Agora</span>
          <div>
            <strong>{atual.titulo}</strong>
            <p>{atual.descricao}</p>
          </div>
        </div>

        <ol className={styles.etapas} aria-label="Etapas da operação">
          {etapas.map((etapa, indice) => {
            const estado =
              indice < etapaAtiva ? 'concluida' : indice === etapaAtiva ? 'ativa' : 'futura';
            return (
              <li key={etapa.titulo} data-estado={estado}>
                <span aria-hidden="true">
                  {indice < etapaAtiva ? <Check size={13} /> : String(indice + 1).padStart(2, '0')}
                </span>
                <strong>{etapa.titulo}</strong>
              </li>
            );
          })}
        </ol>

        <footer className={styles.rodape}>
          <p className={styles.nota} aria-live="polite">
            {demorando && mensagemDemora ? mensagemDemora : nota}
          </p>
          {acaoSecundaria && (
            <button type="button" onClick={acaoSecundaria.aoAcionar}>
              {acaoSecundaria.rotulo}
            </button>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}

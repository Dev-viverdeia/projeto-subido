'use client';

import { useId, useLayoutEffect, type RefObject } from 'react';
import { LoaderCircle, RotateCcw, Send } from 'lucide-react';
import { useRascunhoReuniao } from './RascunhoReuniao';
import styles from './EscreverMensagemReuniao.module.css';

type Props = {
  aberto: boolean;
  conectado: boolean;
  campoRef: RefObject<HTMLTextAreaElement | null>;
  enviar: (texto: string) => Promise<unknown>;
  enviando: boolean;
  aoEnviar: () => void;
};

function ajustarAltura(campo: HTMLTextAreaElement) {
  if (!campo.getClientRects().length) return;
  const caixa = campo.parentElement;
  const minimoAnterior = caixa?.style.minHeight ?? '';
  // Medir o campo temporariamente menor não pode aumentar a área da conversa:
  // o Safari limita seu scrollTop nesse intervalo e parece que a pessoa rolou acima.
  if (caixa) caixa.style.minHeight = `${caixa.getBoundingClientRect().height}px`;
  campo.style.height = '0px';
  campo.style.height = `${campo.scrollHeight}px`;
  if (caixa) caixa.style.minHeight = minimoAnterior;
}

export function EscreverMensagemReuniao({
  aberto,
  conectado,
  campoRef,
  enviar,
  enviando,
  aoEnviar,
}: Props) {
  const {
    texto,
    setTexto,
    estado,
    setEstado,
    emCurso: emCursoRef,
    versaoEnvio: versaoEnvioRef,
  } = useRascunhoReuniao();
  const ajudaId = useId();
  const ocupado = estado === 'enviando' || enviando;
  const excedeu = texto.length > 2000;
  const valido = !!texto.trim() && !excedeu;

  useLayoutEffect(() => {
    if (aberto && campoRef.current) ajustarAltura(campoRef.current);
  }, [texto, aberto, campoRef]);

  useLayoutEffect(() => {
    const campo = campoRef.current;
    if (!aberto || !campo || typeof ResizeObserver === 'undefined') return;
    let largura = campo.getBoundingClientRect().width;
    const observer = new ResizeObserver(() => {
      const atual = campo.getBoundingClientRect().width;
      if (atual === largura) return;
      largura = atual;
      ajustarAltura(campo);
    });
    observer.observe(campo);
    return () => observer.disconnect();
  }, [aberto, campoRef]);

  async function enviarMensagem() {
    if (emCursoRef.current || ocupado || !valido || !conectado) return;
    emCursoRef.current = true;
    const versao = ++versaoEnvioRef.current;
    setEstado('enviando');
    try {
      await enviar(texto.trim());
      if (versao !== versaoEnvioRef.current) return;
      setTexto('');
      setEstado('enviado');
      aoEnviar();
    } catch {
      if (versao === versaoEnvioRef.current) setEstado('erro');
    } finally {
      if (versao === versaoEnvioRef.current) {
        emCursoRef.current = false;
        const campo = campoRef.current;
        // Quem fechou o painel ou foi a outro controle não perde o foco ao terminar o envio.
        if (
          campo?.getClientRects().length &&
          campo.closest('form')?.contains(document.activeElement)
        )
          campo.focus({ preventScroll: true });
      }
    }
  }

  const retorno = ocupado
    ? 'Enviando…'
    : estado === 'incerto'
      ? 'Envio interrompido. Confira com os participantes antes de reenviar.'
      : estado === 'erro'
        ? 'A mensagem não foi enviada. Tente novamente.'
        : excedeu
          ? 'Use até 2.000 caracteres.'
          : !conectado
            ? 'Reconectando. Seu texto foi mantido.'
            : estado === 'enviado'
              ? 'Enviada'
              : '';

  return (
    <form
      className={styles.escrita}
      aria-label="Escrever mensagem"
      onSubmit={(e) => {
        e.preventDefault();
        void enviarMensagem();
      }}
    >
      <div className={styles.caixa} data-invalida={excedeu || undefined}>
        <textarea
          ref={campoRef}
          className={styles.campo}
          aria-label="Mensagem para os participantes"
          aria-describedby={ajudaId}
          aria-invalid={excedeu || undefined}
          value={texto}
          rows={1}
          readOnly={ocupado}
          placeholder="Escreva uma mensagem"
          onChange={(e) => {
            if (ocupado) return;
            setTexto(e.target.value);
            setEstado('pronto');
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.shiftKey || e.altKey) return;
            if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
            const toque = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
            if (toque && !e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            if (!e.repeat) void enviarMensagem();
          }}
        />
        <button
          type="submit"
          className={styles.enviar}
          disabled={!ocupado && (!valido || !conectado)}
          aria-disabled={ocupado || undefined}
          aria-label={
            ocupado
              ? 'Enviando mensagem'
              : estado === 'erro' || estado === 'incerto'
                ? 'Tentar novamente'
                : 'Enviar mensagem'
          }
        >
          {ocupado ? (
            <LoaderCircle size={20} className={styles.carregando} aria-hidden="true" />
          ) : estado === 'erro' || estado === 'incerto' ? (
            <RotateCcw size={20} aria-hidden="true" />
          ) : (
            <Send size={20} aria-hidden="true" />
          )}
        </button>
      </div>
      <div className={styles.apoio}>
        <p
          id={ajudaId}
          role={estado === 'erro' || estado === 'incerto' || excedeu ? 'alert' : 'status'}
          aria-atomic="true"
        >
          {retorno || <span className={styles.atalho}>Shift+Enter para nova linha</span>}
        </p>
        {texto.length >= 1800 && <span className={styles.contagem}>{texto.length} / 2.000</span>}
      </div>
    </form>
  );
}

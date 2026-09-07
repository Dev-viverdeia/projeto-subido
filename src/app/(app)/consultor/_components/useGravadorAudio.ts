'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useGravadorAudio({
  aoConcluir,
  aoFalhar,
}: {
  aoConcluir: (arquivo: File) => void;
  aoFalhar: (mensagem: string) => void;
}) {
  const gravadorRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const versao = useRef(0);
  const solicitando = useRef(false);
  const concluirRef = useRef(aoConcluir);
  const falharRef = useRef(aoFalhar);
  const [gravando, setGravando] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    concluirRef.current = aoConcluir;
    falharRef.current = aoFalhar;
  });

  const liberar = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    intervaloRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    gravadorRef.current = null;
  }, []);

  const descartar = useCallback(() => {
    versao.current++;
    solicitando.current = false;
    const gravador = gravadorRef.current;
    if (gravador) {
      gravador.ondataavailable = null;
      gravador.onstop = null;
      gravador.onerror = null;
      if (gravador.state !== 'inactive') gravador.stop();
    }
    liberar();
  }, [liberar]);

  useEffect(() => descartar, [descartar]);

  const cancelar = useCallback(() => {
    descartar();
    setGravando(false);
    setPreparando(false);
    setSegundos(0);
  }, [descartar]);

  const alternar = useCallback(async () => {
    if (gravadorRef.current) {
      if (gravadorRef.current.state === 'recording') gravadorRef.current.stop();
      return;
    }
    if (solicitando.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      falharRef.current(
        'Este navegador não permite gravar áudio aqui. Você ainda pode anexar um arquivo.',
      );
      return;
    }
    const atual = ++versao.current;
    solicitando.current = true;
    setPreparando(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (atual !== versao.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const tipoPreferido = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((tipo) =>
        MediaRecorder.isTypeSupported(tipo),
      );
      const gravador = new MediaRecorder(stream, tipoPreferido ? { mimeType: tipoPreferido } : {});
      gravadorRef.current = gravador;
      const pedacos: Blob[] = [];
      setSegundos(0);
      gravador.ondataavailable = (evento) => {
        if (atual === versao.current && evento.data.size > 0) pedacos.push(evento.data);
      };
      gravador.onstop = () => {
        if (atual !== versao.current) return;
        liberar();
        setGravando(false);
        const tipo = gravador.mimeType || 'audio/webm';
        const extensao = tipo.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(pedacos, { type: tipo });
        if (!blob.size) {
          falharRef.current('A gravação ficou vazia. Grave novamente.');
          return;
        }
        concluirRef.current(
          new File(
            [blob],
            `Audio Sobral AI ${new Date().toLocaleTimeString('pt-BR')}.${extensao}`,
            { type: tipo, lastModified: Date.now() },
          ),
        );
      };
      gravador.onerror = () => {
        if (atual !== versao.current) return;
        cancelar();
        falharRef.current('A gravação foi interrompida. Grave novamente ou anexe um áudio.');
      };
      gravador.start(500);
      setGravando(true);
      intervaloRef.current = setInterval(() => setSegundos((valor) => valor + 1), 1000);
    } catch {
      if (atual !== versao.current) return;
      liberar();
      setGravando(false);
      falharRef.current(
        'Não consegui acessar o microfone. Autorize o acesso ou anexe um áudio pronto.',
      );
    } finally {
      if (atual === versao.current) {
        solicitando.current = false;
        setPreparando(false);
      }
    }
  }, [cancelar, liberar]);

  return { gravando, preparando, segundos, alternar, cancelar };
}

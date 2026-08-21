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
  const pedacosAudio = useRef<Blob[]>([]);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const concluirRef = useRef(aoConcluir);
  const falharRef = useRef(aoFalhar);
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    concluirRef.current = aoConcluir;
    falharRef.current = aoFalhar;
  });

  useEffect(
    () => () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const alternar = useCallback(async () => {
    if (gravadorRef.current?.state === 'recording') {
      gravadorRef.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      falharRef.current(
        'Este navegador não permite gravar áudio aqui. Você ainda pode anexar um arquivo.',
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipoPreferido = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((tipo) =>
        MediaRecorder.isTypeSupported(tipo),
      );
      const gravador = new MediaRecorder(stream, tipoPreferido ? { mimeType: tipoPreferido } : {});
      streamRef.current = stream;
      gravadorRef.current = gravador;
      pedacosAudio.current = [];
      setSegundos(0);

      gravador.ondataavailable = (evento) => {
        if (evento.data.size > 0) pedacosAudio.current.push(evento.data);
      };
      gravador.onstop = () => {
        if (intervaloRef.current) clearInterval(intervaloRef.current);
        intervaloRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        gravadorRef.current = null;
        setGravando(false);

        const tipo = gravador.mimeType || 'audio/webm';
        const extensao = tipo.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(pedacosAudio.current, { type: tipo });
        if (blob.size > 0) {
          concluirRef.current(
            new File(
              [blob],
              `Audio Sobral AI ${new Date().toLocaleTimeString('pt-BR')}.${extensao}`,
              { type: tipo, lastModified: Date.now() },
            ),
          );
        }
      };

      gravador.start(500);
      setGravando(true);
      intervaloRef.current = setInterval(() => setSegundos((valor) => valor + 1), 1000);
    } catch {
      falharRef.current(
        'Não consegui acessar o microfone. Autorize o acesso ou anexe um áudio pronto.',
      );
    }
  }, []);

  return { gravando, segundos, alternar };
}

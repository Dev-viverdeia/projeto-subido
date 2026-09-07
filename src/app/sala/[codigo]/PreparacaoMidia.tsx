'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { usePreparacaoMidia } from './usePreparacaoMidia';
import styles from './PreparacaoMidia.module.css';

function NivelMicrofone({ stream }: { stream: MediaStream | null }) {
  const barra = useRef<HTMLSpanElement>(null);
  const [captou, setCaptou] = useState(false);
  const [disponivel, setDisponivel] = useState(true);
  useEffect(() => {
    if (!stream) return;
    const entrada = stream;
    let contexto: AudioContext | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelado = false;
    async function iniciar() {
      try {
        contexto = new AudioContext();
        await contexto.resume();
        if (cancelado) return;
        const fonte = contexto.createMediaStreamSource(entrada);
        const analisador = contexto.createAnalyser();
        analisador.fftSize = 256;
        fonte.connect(analisador); // Sem conexão à saída: não reproduz a própria voz.
        const dados = new Uint8Array(analisador.fftSize);
        timer = setInterval(() => {
          analisador.getByteTimeDomainData(dados);
          const rms = Math.sqrt(
            dados.reduce((soma, v) => soma + ((v - 128) / 128) ** 2, 0) / dados.length,
          );
          if (barra.current) barra.current.style.transform = `scaleX(${Math.min(1, rms * 5)})`;
          if (rms > 0.015) setCaptou(true);
        }, 100);
      } catch {
        if (!cancelado) setDisponivel(false);
      }
    }
    void iniciar();
    return () => {
      cancelado = true;
      clearInterval(timer);
      if (contexto && contexto.state !== 'closed') void contexto.close().catch(() => {});
    };
  }, [stream]);
  return (
    <div className={styles.medidor}>
      <span role="status">
        {!stream
          ? 'Microfone desligado'
          : !disponivel
            ? 'Microfone ativo · medidor indisponível'
            : captou
              ? 'Microfone captando sua voz'
              : 'Fale para testar o microfone'}
      </span>
      <div aria-hidden="true">
        <span ref={barra} />
      </div>
    </div>
  );
}

export function PreparacaoMidia({
  midia,
  bloqueado = false,
}: {
  midia: ReturnType<typeof usePreparacaoMidia>;
  bloqueado?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [testou, setTestou] = useState(false);
  useEffect(() => {
    const elemento = video.current;
    if (!elemento) return;
    elemento.srcObject = midia.streams.video;
    if (midia.streams.video) void elemento.play().catch(() => {});
    return () => {
      elemento.srcObject = null;
    };
  }, [midia.streams.video]);
  const aguardando = midia.ocupado.audio || midia.ocupado.video;

  return (
    <section className={styles.preparacao} aria-label="Câmera e microfone antes da reunião">
      <div className={styles.previa} data-inativa={!testou || undefined}>
        <video
          ref={video}
          autoPlay
          playsInline
          muted
          aria-label="Sua prévia de câmera"
          hidden={!midia.escolhas.video}
        />
        {!midia.escolhas.video && (
          <div className={styles.semVideo}>
            <VideoOff size={32} strokeWidth={1.4} aria-hidden="true" />
            <span>Câmera desligada</span>
          </div>
        )}
        <span className={styles.privacidade}>Só você vê esta prévia</span>
      </div>
      {!testou ? (
        <button
          type="button"
          className={styles.ativar}
          disabled={bloqueado}
          onClick={() => {
            setTestou(true);
            void midia.ativar('audio');
            void midia.ativar('video');
          }}
        >
          <Video size={18} aria-hidden="true" /> Testar câmera e microfone
        </button>
      ) : (
        <div className={styles.controles}>
          {(['audio', 'video'] as const).map((tipo) => {
            const ativo = midia.escolhas[tipo];
            const nome = tipo === 'audio' ? 'microfone' : 'câmera';
            const Icone = tipo === 'audio' ? (ativo ? Mic : MicOff) : ativo ? Video : VideoOff;
            return (
              <button
                key={tipo}
                type="button"
                aria-pressed={ativo}
                aria-label={`${ativo ? 'Desligar' : 'Ativar'} ${nome}`}
                disabled={bloqueado}
                onClick={() =>
                  ativo || midia.ocupado[tipo]
                    ? midia.desligar(tipo)
                    : void midia.ativar(
                        tipo,
                        tipo === 'audio' ? midia.escolhas.microfoneId : midia.escolhas.cameraId,
                      )
                }
              >
                <Icone size={18} aria-hidden="true" />
                {midia.ocupado[tipo]
                  ? 'Cancelar ativação'
                  : tipo === 'audio'
                    ? 'Microfone'
                    : 'Câmera'}
              </button>
            );
          })}
        </div>
      )}
      {aguardando && (
        <p role="status" className={styles.ajuda}>
          Autorize o acesso no navegador. Você também pode entrar com os dispositivos desligados.
        </p>
      )}
      {(midia.erros.audio || midia.erros.video) && (
        <div className={styles.erros} role="alert">
          {midia.erros.audio && <p>{midia.erros.audio}</p>}
          {midia.erros.video && <p>{midia.erros.video}</p>}
        </div>
      )}
      {testou && (
        <>
          <NivelMicrofone
            key={midia.escolhas.microfoneId + String(midia.escolhas.audio)}
            stream={midia.streams.audio}
          />
          <details className={styles.dispositivos}>
            <summary>Escolher dispositivos</summary>
            {(['audio', 'video'] as const).map((tipo) => {
              const lista = midia.dispositivos.filter(
                (d) => d.kind === (tipo === 'audio' ? 'audioinput' : 'videoinput'),
              );
              const id = tipo === 'audio' ? midia.escolhas.microfoneId : midia.escolhas.cameraId;
              return (
                <label key={tipo}>
                  {tipo === 'audio' ? 'Microfone' : 'Câmera'}
                  <select
                    value={lista.some((d) => d.deviceId === id) ? id : ''}
                    disabled={bloqueado || midia.ocupado[tipo]}
                    onChange={(e) => midia.selecionar(tipo, e.target.value)}
                  >
                    <option value="">Padrão do dispositivo</option>
                    {lista
                      .filter((d) => d.deviceId)
                      .map((d, i) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `${tipo === 'audio' ? 'Microfone' : 'Câmera'} ${i + 1}`}
                        </option>
                      ))}
                  </select>
                </label>
              );
            })}
          </details>
        </>
      )}
    </section>
  );
}

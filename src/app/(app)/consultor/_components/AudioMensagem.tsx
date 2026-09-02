'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Pause, Play, X } from 'lucide-react';
import styles from './AudioMensagem.module.css';

function tempoLegivel(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return '00:00';
  const total = Math.floor(segundos);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function AudioMensagem({
  arquivo,
  src,
  estado,
  aoRemover,
}: {
  arquivo?: File;
  src?: string;
  estado?: string;
  aoRemover?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const origem = useMemo(
    () => (arquivo ? URL.createObjectURL(arquivo) : (src ?? '')),
    [arquivo, src],
  );
  const [tocando, setTocando] = useState(false);
  const [duracao, setDuracao] = useState(0);
  const [posicao, setPosicao] = useState(0);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    return () => {
      if (arquivo) URL.revokeObjectURL(origem);
    };
  }, [arquivo, origem]);

  async function alternar() {
    const audio = audioRef.current;
    if (!audio || !origem || falhou) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setFalhou(true);
      }
    } else {
      audio.pause();
    }
  }

  return (
    <div className={styles.player} data-falhou={falhou || undefined}>
      <audio
        ref={audioRef}
        src={origem || undefined}
        preload="metadata"
        onLoadedMetadata={(evento) => setDuracao(evento.currentTarget.duration)}
        onDurationChange={(evento) => setDuracao(evento.currentTarget.duration)}
        onTimeUpdate={(evento) => setPosicao(evento.currentTarget.currentTime)}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => {
          setTocando(false);
          setPosicao(0);
        }}
        onError={() => setFalhou(true)}
      />

      <button
        type="button"
        className={styles.reproduzir}
        onClick={() => void alternar()}
        disabled={!origem || falhou}
        aria-label={tocando ? 'Pausar áudio' : 'Reproduzir áudio'}
      >
        {tocando ? (
          <Pause size={17} fill="currentColor" aria-hidden="true" />
        ) : (
          <Play size={17} fill="currentColor" aria-hidden="true" />
        )}
      </button>

      <div className={styles.conteudo}>
        <div className={styles.cabecalho}>
          <strong>{falhou ? 'Áudio indisponível' : 'Mensagem de áudio'}</strong>
          {estado ? <span>{estado}</span> : null}
        </div>
        <div className={styles.progresso}>
          <span>{tempoLegivel(posicao)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(duracao, 0)}
            step={0.1}
            value={Math.min(posicao, duracao || 0)}
            disabled={!duracao || falhou}
            aria-label="Posição do áudio"
            style={
              {
                '--audio-progresso': `${duracao > 0 ? (posicao / duracao) * 100 : 0}%`,
              } as CSSProperties
            }
            onChange={(evento) => {
              const novaPosicao = Number(evento.target.value);
              if (audioRef.current) audioRef.current.currentTime = novaPosicao;
              setPosicao(novaPosicao);
            }}
          />
          <span>{tempoLegivel(duracao)}</span>
        </div>
      </div>

      {aoRemover ? (
        <button
          type="button"
          className={styles.remover}
          onClick={aoRemover}
          aria-label="Remover mensagem de áudio"
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { Pause, Play, RotateCw, X } from 'lucide-react';
import { useArquivoLocal } from './useArquivoLocal';
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
  const local = useArquivoLocal(arquivo);
  const origem = arquivo ? local : src;
  return <PlayerAudio key={origem} origem={origem} estado={estado} aoRemover={aoRemover} />;
}

function PlayerAudio({
  origem,
  estado,
  aoRemover,
}: {
  origem?: string;
  estado?: string;
  aoRemover?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [duracao, setDuracao] = useState(0);
  const [posicao, setPosicao] = useState(0);
  const [falhou, setFalhou] = useState(false);

  function atualizarDuracao(audio: HTMLAudioElement) {
    setDuracao(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
  }

  function recarregar() {
    setFalhou(false);
    setTocando(false);
    setPosicao(0);
    setDuracao(0);
    audioRef.current?.load();
  }

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
        onLoadedMetadata={(evento) => atualizarDuracao(evento.currentTarget)}
        onDurationChange={(evento) => atualizarDuracao(evento.currentTarget)}
        onTimeUpdate={(evento) => setPosicao(evento.currentTarget.currentTime)}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => {
          setTocando(false);
          setPosicao(0);
        }}
        onError={() => {
          setFalhou(true);
          setTocando(false);
        }}
      />

      <button
        type="button"
        className={styles.reproduzir}
        onClick={() => (falhou ? recarregar() : void alternar())}
        disabled={!origem}
        aria-label={
          falhou ? 'Tentar carregar áudio novamente' : tocando ? 'Pausar áudio' : 'Reproduzir áudio'
        }
      >
        {falhou ? (
          <RotateCw size={19} aria-hidden="true" />
        ) : tocando ? (
          <Pause size={17} fill="currentColor" aria-hidden="true" />
        ) : (
          <Play size={17} fill="currentColor" aria-hidden="true" />
        )}
      </button>

      <div className={styles.conteudo}>
        <div className={styles.cabecalho}>
          <strong>{falhou ? 'Não foi possível tocar' : 'Mensagem de áudio'}</strong>
          {falhou ? <span>Toque para tentar de novo</span> : estado ? <span>{estado}</span> : null}
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

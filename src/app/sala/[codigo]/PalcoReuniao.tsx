'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  RoomAudioRenderer,
  VideoTrack,
  TrackToggle,
  TrackMutedIndicator,
  DisconnectButton,
  StartMediaButton,
  useTracks,
  useLocalParticipant,
  useLocalParticipantPermissions,
  useRoomContext,
  useConnectionState,
  useChat,
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import {
  ChevronDown,
  Maximize2,
  MessageSquare,
  Minimize2,
  PhoneOff,
  Send,
  Settings2,
  VideoOff,
  X,
} from 'lucide-react';
import type { EscolhasMidia } from './usePreparacaoMidia';
import styles from './PalcoReuniao.module.css';

type Props = {
  anfitriao: boolean;
  escolhas: EscolhasMidia;
  aoMudarEscolhas: Dispatch<SetStateAction<EscolhasMidia>>;
  aoFalhar: (erro: Error, tipo?: MediaDeviceKind) => void;
};

function DispositivosSala({ escolhas, aoMudarEscolhas, aoFalhar }: Omit<Props, 'anfitriao'>) {
  const room = useRoomContext();
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<MediaDeviceInfo[]>([]);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;
    const atualizar = async () => {
      try {
        const dados = await navigator.mediaDevices.enumerateDevices();
        if (!cancelado) setLista(dados);
      } catch {
        /* Não solicita permissões adicionais ao abrir configurações. */
      }
    };
    void atualizar();
    const aoTrocar = () => {
      void atualizar();
    };
    navigator.mediaDevices?.addEventListener('devicechange', aoTrocar);
    return () => {
      cancelado = true;
      navigator.mediaDevices?.removeEventListener('devicechange', aoTrocar);
    };
  }, [aberto]);

  async function selecionar(tipo: 'audioinput' | 'videoinput', id: string) {
    setOcupado(true);
    try {
      if (!(await room.switchActiveDevice(tipo, id))) throw new Error('Dispositivo indisponível');
      aoMudarEscolhas((atual) => ({
        ...atual,
        [tipo === 'audioinput' ? 'microfoneId' : 'cameraId']: id,
      }));
    } catch (erro) {
      aoFalhar(erro instanceof Error ? erro : new Error('Dispositivo indisponível'), tipo);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <details
      className={styles.dispositivos}
      onToggle={(e) => setAberto(e.currentTarget.open)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.currentTarget.open = false;
          e.currentTarget.querySelector('summary')?.focus();
        }
      }}
    >
      <summary aria-label="Configurar câmera e microfone">
        <Settings2 size={20} aria-hidden="true" />
        <span>Dispositivos</span>
        <ChevronDown size={14} aria-hidden="true" />
      </summary>
      <div className={styles.opcoes}>
        {(['audioinput', 'videoinput'] as const).map((tipo) => {
          const id = tipo === 'audioinput' ? escolhas.microfoneId : escolhas.cameraId;
          const itens = lista.filter((d) => d.kind === tipo && d.deviceId);
          return (
            <label key={tipo}>
              {tipo === 'audioinput' ? 'Microfone da reunião' : 'Câmera da reunião'}
              <select
                disabled={ocupado}
                value={itens.some((d) => d.deviceId === id) ? id : ''}
                onChange={(e) => void selecionar(tipo, e.target.value)}
              >
                <option value="">Padrão do dispositivo</option>
                {itens.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Dispositivo ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
        <p>Ative o microfone ou a câmera para liberar os nomes dos dispositivos.</p>
      </div>
    </details>
  );
}

export function PalcoReuniao({ anfitriao, escolhas, aoMudarEscolhas, aoFalhar }: Props) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const permissoes = useLocalParticipantPermissions();
  const conexao = useConnectionState();
  const [fixado, setFixado] = useState<string | null>(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erroChat, setErroChat] = useState('');
  const { chatMessages, send, isSending } = useChat();
  const mensagens = useRef<HTMLDivElement>(null);
  const campoChat = useRef<HTMLInputElement>(null);
  const botaoChat = useRef<HTMLButtonElement>(null);
  const [lidas, setLidas] = useState(0);
  const chave = (track: (typeof tracks)[number]) => `${track.participant.identity}:${track.source}`;
  const tela = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const destaque = tracks.find((t) => chave(t) === fixado) ?? tela;
  const permite = (source: number) =>
    permissoes?.canPublish &&
    (!permissoes.canPublishSources.length || permissoes.canPublishSources.includes(source));

  useEffect(() => {
    if (chatAberto) {
      if (mensagens.current) mensagens.current.scrollTop = mensagens.current.scrollHeight;
    }
  }, [chatAberto, chatMessages.length]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!mensagem.trim() || isSending) return;
    setErroChat('');
    try {
      await send(mensagem.trim());
      setMensagem('');
      campoChat.current?.focus();
    } catch {
      setErroChat('A mensagem não foi enviada. Confira sua conexão e tente novamente.');
    }
  }

  function fecharChat() {
    setLidas(chatMessages.length);
    setChatAberto(false);
    botaoChat.current?.focus();
  }

  return (
    <div className={`lk-video-conference ${styles.palco}`}>
      {conexao !== ConnectionState.Connected && (
        <p className={styles.conexao} role="status">
          {conexao === ConnectionState.Connecting
            ? 'Conectando à reunião…'
            : 'Reconectando à reunião…'}
        </p>
      )}
      <div className={styles.conteudo}>
        <div
          className={styles.grade}
          data-foco={!!destaque || undefined}
          aria-label="Participantes da reunião"
          tabIndex={0}
        >
          {tracks.map((track) => {
            const nome = track.participant.name || 'Participante';
            const compartilhando = track.source === Track.Source.ScreenShare;
            const visivel = !!track.publication?.track && !track.publication.isMuted;
            return (
              <article
                key={chave(track)}
                className={`lk-participant-tile ${styles.pessoa}`}
                data-destaque={(destaque && chave(destaque) === chave(track)) || undefined}
                data-lk-source={track.source}
              >
                {visivel && track.publication ? (
                  <VideoTrack
                    trackRef={{ ...track, publication: track.publication }}
                    aria-label={compartilhando ? `Tela de ${nome}` : `Vídeo de ${nome}`}
                  />
                ) : (
                  <div className={styles.semVideo}>
                    <VideoOff size={28} strokeWidth={1.4} aria-hidden="true" />
                    <span>{nome}</span>
                  </div>
                )}
                <div className={styles.nome}>
                  <TrackMutedIndicator
                    trackRef={{ participant: track.participant, source: Track.Source.Microphone }}
                    show="muted"
                    role="img"
                    aria-label="Microfone desligado"
                  />
                  <span>
                    {compartilhando
                      ? `Tela de ${nome}`
                      : `${nome}${track.participant.isLocal ? ' (você)' : ''}`}
                  </span>
                  <button
                    type="button"
                    aria-label={fixado === chave(track) ? `Desafixar ${nome}` : `Destacar ${nome}`}
                    onClick={() => setFixado(fixado === chave(track) ? null : chave(track))}
                  >
                    {fixado === chave(track) ? (
                      <Minimize2 size={16} aria-hidden="true" />
                    ) : (
                      <Maximize2 size={16} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <section
          className={styles.chat}
          hidden={!chatAberto}
          aria-label="Mensagens da reunião"
          onKeyDown={(e) => {
            if (e.key === 'Escape') fecharChat();
          }}
        >
          <header>
            <h2>Mensagens</h2>
            <button type="button" onClick={fecharChat} aria-label="Fechar mensagens">
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div
            ref={mensagens}
            className={styles.mensagens}
            role="log"
            aria-label="Conversa da reunião"
            tabIndex={0}
          >
            <p className={styles.avisoChat}>
              Visíveis para quem está na sala. Não ficam salvas após sair.
            </p>
            {chatMessages.map((msg) => (
              <p key={msg.id}>
                <strong>{msg.from?.name || 'Participante'}</strong>
                <span>{msg.message}</span>
              </p>
            ))}
          </div>
          {erroChat && (
            <p role="alert" className={styles.avisoChat}>
              {erroChat}
            </p>
          )}
          <form onSubmit={(e) => void enviar(e)}>
            <input
              ref={campoChat}
              aria-label="Mensagem para os participantes"
              value={mensagem}
              maxLength={2000}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva uma mensagem"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!mensagem.trim() || isSending}
              aria-label={isSending ? 'Enviando mensagem' : 'Enviar mensagem'}
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </section>
      </div>
      <div className={styles.controles} aria-label="Controles da reunião">
        {permite(2) && (
          <TrackToggle
            source={Track.Source.Microphone}
            aria-label={isMicrophoneEnabled ? 'Desligar microfone' : 'Ativar microfone'}
            captureOptions={{ deviceId: escolhas.microfoneId || undefined }}
            onChange={(audio, usuario) => {
              if (usuario) aoMudarEscolhas((atual) => ({ ...atual, audio }));
            }}
            onDeviceError={(erro) => aoFalhar(erro, 'audioinput')}
          >
            <span>Microfone</span>
          </TrackToggle>
        )}
        {permite(1) && (
          <TrackToggle
            source={Track.Source.Camera}
            aria-label={isCameraEnabled ? 'Desligar câmera' : 'Ativar câmera'}
            captureOptions={{ deviceId: escolhas.cameraId || undefined }}
            onChange={(video, usuario) => {
              if (usuario) aoMudarEscolhas((atual) => ({ ...atual, video }));
            }}
            onDeviceError={(erro) => aoFalhar(erro, 'videoinput')}
          >
            <span>Câmera</span>
          </TrackToggle>
        )}
        {permite(3) &&
          typeof navigator !== 'undefined' &&
          !!navigator.mediaDevices?.getDisplayMedia && (
            <TrackToggle
              source={Track.Source.ScreenShare}
              aria-label={isScreenShareEnabled ? 'Parar compartilhamento' : 'Compartilhar tela'}
              captureOptions={{ audio: true }}
              onDeviceError={(erro) => {
                if (erro.name !== 'NotAllowedError') aoFalhar(erro);
              }}
            >
              <span>{isScreenShareEnabled ? 'Parar tela' : 'Compartilhar'}</span>
            </TrackToggle>
          )}
        <DispositivosSala
          escolhas={escolhas}
          aoMudarEscolhas={aoMudarEscolhas}
          aoFalhar={aoFalhar}
        />
        {permissoes?.canPublishData && (
          <button
            ref={botaoChat}
            type="button"
            aria-label="Mensagens da reunião"
            aria-expanded={chatAberto}
            onClick={() => {
              setLidas(chatMessages.length);
              setChatAberto(!chatAberto);
              if (!chatAberto) requestAnimationFrame(() => campoChat.current?.focus());
            }}
          >
            <MessageSquare size={20} aria-hidden="true" />
            <span>Mensagens</span>
            {!chatAberto && chatMessages.length > lidas && (
              <small>{chatMessages.length - lidas}</small>
            )}
          </button>
        )}
        <DisconnectButton
          className={styles.sair}
          aria-label={anfitriao ? 'Encerrar reunião' : 'Sair da reunião'}
        >
          <PhoneOff size={20} aria-hidden="true" />
          <span>{anfitriao ? 'Encerrar' : 'Sair'}</span>
        </DisconnectButton>
      </div>
      <StartMediaButton label="Ativar som e vídeo da reunião" className={styles.reproduzir} />
      <RoomAudioRenderer />
    </div>
  );
}

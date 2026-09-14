'use client';

import { useId, useRef, useState, type Dispatch, type SetStateAction } from 'react';
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
  useConnectionState,
  useChat,
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import {
  ArrowDown,
  Maximize2,
  MessageSquare,
  Minimize2,
  PhoneOff,
  VideoOff,
  X,
} from 'lucide-react';
import type { EscolhasMidia } from './usePreparacaoMidia';
import { EncerrarReuniao } from './EncerrarReuniao';
import { DispositivosSala } from './DispositivosSala';
import { MensagemReuniao } from './MensagemReuniao';
import { useLeituraChat } from './useLeituraChat';
import { EscreverMensagemReuniao } from './EscreverMensagemReuniao';
import styles from './PalcoReuniao.module.css';

type Props = {
  anfitriao: boolean;
  escolhas: EscolhasMidia;
  aoMudarEscolhas: Dispatch<SetStateAction<EscolhasMidia>>;
  aoFalhar: (erro: Error, tipo?: MediaDeviceKind) => void;
  aoEncerrar?: () => Promise<void>;
  aoSair?: () => Promise<void>;
};

export function PalcoReuniao({
  anfitriao,
  escolhas,
  aoMudarEscolhas,
  aoFalhar,
  aoEncerrar,
  aoSair,
}: Props) {
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
  const { chatMessages, send, isSending } = useChat();
  const { mensagens, conteudo, fim, afastado, novas, guardarPosicao, irParaRecentes } =
    useLeituraChat(chatAberto, chatMessages.length);
  const avisoNovasId = useId();
  const campoChat = useRef<HTMLTextAreaElement>(null);
  const botaoChat = useRef<HTMLButtonElement>(null);
  const chave = (track: (typeof tracks)[number]) => `${track.participant.identity}:${track.source}`;
  const tela = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const destaque = tracks.find((t) => chave(t) === fixado) ?? tela;
  const permite = (source: number) =>
    permissoes?.canPublish &&
    (!permissoes.canPublishSources.length || permissoes.canPublishSources.includes(source));

  function fecharChat() {
    guardarPosicao();
    setChatAberto(false);
    botaoChat.current?.focus();
  }

  return (
    <div
      className={`lk-video-conference ${styles.palco}`}
      data-anfitriao={anfitriao || undefined}
      data-chat-aberto={chatAberto || undefined}
    >
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
            if (e.key === 'Escape' && !e.nativeEvent.isComposing) fecharChat();
          }}
        >
          <header>
            <h2>Mensagens</h2>
            <button type="button" onClick={fecharChat} aria-label="Fechar mensagens">
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.leituraChat}>
            <div
              ref={mensagens}
              className={styles.mensagens}
              role="log"
              aria-live={afastado ? 'off' : 'polite'}
              aria-label="Conversa da reunião"
              tabIndex={0}
            >
              <div ref={conteudo}>
                <p className={styles.avisoChat}>
                  Visíveis para quem está na sala. Não ficam salvas após sair.
                </p>
                {chatMessages.map((msg) => (
                  <MensagemReuniao
                    key={msg.id}
                    autor={msg.from?.name || 'Participante'}
                    texto={msg.message}
                    propria={msg.from?.isLocal}
                  />
                ))}
                <div ref={fim} className={styles.fimMensagens} aria-hidden="true" />
              </div>
            </div>
            {afastado && (
              <button
                type="button"
                className={styles.recentes}
                onClick={() => {
                  irParaRecentes();
                  mensagens.current?.focus({ preventScroll: true });
                }}
              >
                {novas > 0
                  ? `${novas} ${novas === 1 ? 'nova mensagem' : 'novas mensagens'}`
                  : 'Ver recentes'}
                <ArrowDown size={18} aria-hidden="true" />
              </button>
            )}
          </div>
          <span id={avisoNovasId} className="sr-only" role="status" aria-atomic="true">
            {novas > 0
              ? `${novas} ${novas === 1 ? 'mensagem não lida' : 'mensagens não lidas'}`
              : ''}
          </span>
          <EscreverMensagemReuniao
            aberto={chatAberto}
            conectado={conexao === ConnectionState.Connected}
            campoRef={campoChat}
            enviar={send}
            enviando={isSending}
            aoEnviar={irParaRecentes}
          />
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
            aria-describedby={novas > 0 ? avisoNovasId : undefined}
            aria-expanded={chatAberto}
            onClick={() => {
              if (chatAberto) fecharChat();
              else {
                setChatAberto(true);
                requestAnimationFrame(() => campoChat.current?.focus());
              }
            }}
          >
            <MessageSquare size={20} aria-hidden="true" />
            <span>Mensagens</span>
            {!chatAberto && novas > 0 && <small>{novas}</small>}
          </button>
        )}
        {anfitriao ? (
          <EncerrarReuniao aoEncerrar={aoEncerrar} aoSair={aoSair} />
        ) : (
          <DisconnectButton className={styles.sair} aria-label="Sair da reunião">
            <PhoneOff size={20} aria-hidden="true" />
            <span>Sair</span>
          </DisconnectButton>
        )}
      </div>
      <StartMediaButton label="Ativar som e vídeo da reunião" className={styles.reproduzir} />
      <RoomAudioRenderer />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext, useTracks } from '@livekit/components-react';
import { AudioLines, LockKeyhole, MessageSquareQuote, Radio, Sparkles } from 'lucide-react';
import { RoomEvent, Track } from 'livekit-client';
import type { SegmentoLive } from '@/lib/calls/coach-schema';
import styles from './LiveCoach.module.css';

type EstadoCoach = 'conectando' | 'escutando' | 'analisando' | 'indisponivel';

export type SugestaoLive = {
  id: string;
  categoria: string;
  titulo: string;
  sugestao: string;
  metodologia: string | null;
  trecho_gatilho: string | null;
  prioridade: number;
};

type EventoRealtime = {
  type?: string;
  item_id?: string;
  previous_item_id?: string | null;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};

const ROTULO_ESTADO: Record<EstadoCoach, string> = {
  conectando: 'Conectando inteligência',
  escutando: 'Escutando a conversa',
  analisando: 'Lendo o momento',
  indisponivel: 'Transcrição indisponível',
};

export function LiveCoach({ reuniaoId, ativo }: { reuniaoId: string; ativo: boolean }) {
  const room = useRoomContext();
  const referencias = useTracks([Track.Source.Microphone]);
  const [estado, setEstado] = useState<EstadoCoach>('conectando');
  const [sugestao, setSugestao] = useState<SugestaoLive | null>(null);
  const [parcial, setParcial] = useState('');
  const [ultimaFala, setUltimaFala] = useState('Aguardando a primeira fala…');
  const [falha, setFalha] = useState('');
  const [versaoFila, setVersaoFila] = useState(0);
  const inicioRef = useRef<number | null>(null);
  const ordinalRef = useRef(0);
  const ordemItensRef = useRef(new Map<string, number>());
  const segmentosRef = useRef(new Map<string, SegmentoLive>());
  const pendentesRef = useRef<SegmentoLive[]>([]);
  const parciaisRef = useRef(new Map<string, string>());
  const envioRef = useRef(false);
  const finalizadaRef = useRef(false);

  const trilhas = referencias
    .map((referencia) => referencia.publication?.track?.mediaStreamTrack)
    .filter((trilha): trilha is MediaStreamTrack => Boolean(trilha));
  const assinaturaTrilhas = trilhas
    .map((trilha) => trilha.id)
    .sort()
    .join('|');

  const enviarPendentes = useCallback(async () => {
    if (envioRef.current || pendentesRef.current.length === 0) return;
    envioRef.current = true;
    let concluido = false;
    const lote = pendentesRef.current.splice(0, 24);
    if (ativo) setEstado('analisando');

    try {
      const response = await fetch(`/api/calls/${reuniaoId}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentos: lote }),
      });
      const resultado = (await response.json()) as {
        erro?: string;
        sugestao?: SugestaoLive | null;
      };
      if (!response.ok) throw new Error(resultado.erro || 'Não foi possível salvar este trecho.');
      if (resultado.sugestao && ativo) setSugestao(resultado.sugestao);
      setFalha('');
      setEstado('escutando');
      concluido = true;
    } catch (erro) {
      pendentesRef.current = [...lote, ...pendentesRef.current];
      setFalha(erro instanceof Error ? erro.message : 'A inteligência da call foi interrompida.');
      setEstado('indisponivel');
    } finally {
      envioRef.current = false;
      if (concluido && pendentesRef.current.length > 0) {
        setVersaoFila((versao) => versao + 1);
      }
    }
  }, [ativo, reuniaoId]);

  useEffect(() => {
    if (versaoFila === 0) return;
    const timer = setTimeout(() => void enviarPendentes(), 1_100);
    return () => clearTimeout(timer);
  }, [enviarPendentes, versaoFila]);

  const registrarEvento = useCallback((evento: EventoRealtime) => {
    const itemId = evento.item_id;
    if (!itemId) return;

    if (evento.type === 'input_audio_buffer.committed') {
      if (!ordemItensRef.current.has(itemId)) {
        ordemItensRef.current.set(itemId, ordinalRef.current++);
      }
      return;
    }

    if (evento.type === 'conversation.item.input_audio_transcription.delta') {
      const texto = `${parciaisRef.current.get(itemId) ?? ''}${evento.delta ?? ''}`;
      parciaisRef.current.set(itemId, texto);
      setParcial(texto);
      return;
    }

    if (evento.type === 'conversation.item.input_audio_transcription.completed') {
      const texto = (evento.transcript || parciaisRef.current.get(itemId) || '').trim();
      parciaisRef.current.delete(itemId);
      setParcial('');
      if (!texto) return;

      const existente = segmentosRef.current.get(itemId);
      const inicio = inicioRef.current ?? Date.now();
      inicioRef.current = inicio;
      const segmento: SegmentoLive = {
        itemId,
        texto,
        ordinal: existente?.ordinal ?? ordemItensRef.current.get(itemId) ?? ordinalRef.current++,
        segundoReuniao: Math.max(0, Math.floor((Date.now() - inicio) / 1_000)),
        finalizadoEm: new Date().toISOString(),
      };
      segmentosRef.current.set(itemId, segmento);
      if (!existente) pendentesRef.current.push(segmento);
      setUltimaFala(texto);
      setEstado('escutando');
      setVersaoFila((versao) => versao + 1);
    }

    if (evento.type === 'error' || evento.type?.endsWith('.failed')) {
      setFalha(evento.error?.message || 'A transcrição perdeu a conexão.');
      setEstado('indisponivel');
    }
  }, []);

  useEffect(() => {
    if (!assinaturaTrilhas) return;
    let cancelado = false;
    let peer: RTCPeerConnection | null = null;
    let audioContext: AudioContext | null = null;
    const fontes: MediaStreamAudioSourceNode[] = [];

    async function conectar() {
      try {
        inicioRef.current ??= Date.now();
        setEstado('conectando');
        setFalha('');
        const AudioContextClass =
          window.AudioContext ??
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextClass) throw new Error('Este navegador não suporta áudio ao vivo.');

        audioContext = new AudioContextClass();
        await audioContext.resume();
        const destino = audioContext.createMediaStreamDestination();
        for (const trilha of trilhas) {
          const fonte = audioContext.createMediaStreamSource(new MediaStream([trilha]));
          fonte.connect(destino);
          fontes.push(fonte);
        }
        const trilhaMista = destino.stream.getAudioTracks()[0];
        if (!trilhaMista) throw new Error('O áudio da reunião ainda não está disponível.');

        peer = new RTCPeerConnection();
        peer.addTrack(trilhaMista, destino.stream);
        const canal = peer.createDataChannel('oai-events');
        canal.addEventListener('open', () => !cancelado && setEstado('escutando'));
        canal.addEventListener('message', (mensagem) => {
          try {
            registrarEvento(JSON.parse(String(mensagem.data)) as EventoRealtime);
          } catch {
            // Eventos que não são JSON não carregam transcrição e podem ser ignorados.
          }
        });

        const oferta = await peer.createOffer();
        await peer.setLocalDescription(oferta);
        const response = await fetch(`/api/calls/${reuniaoId}/realtime`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: oferta.sdp,
        });
        if (!response.ok) {
          const resultado = (await response.json().catch(() => null)) as { erro?: string } | null;
          throw new Error(resultado?.erro || 'A transcrição ao vivo não pôde ser iniciada.');
        }
        await peer.setRemoteDescription({ type: 'answer', sdp: await response.text() });
      } catch (erro) {
        if (cancelado) return;
        setFalha(erro instanceof Error ? erro.message : 'A transcrição não pôde ser iniciada.');
        setEstado('indisponivel');
      }
    }

    void conectar();
    return () => {
      cancelado = true;
      peer?.close();
      for (const fonte of fontes) fonte.disconnect();
      void audioContext?.close();
    };
    // A assinatura muda somente quando uma mídia real entra ou sai da mistura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinaturaTrilhas, registrarEvento, reuniaoId]);

  const finalizar = useCallback(() => {
    if (finalizadaRef.current) return;
    finalizadaRef.current = true;
    const naoSalvos = pendentesRef.current.slice(-24);
    void fetch(`/api/calls/${reuniaoId}/finalizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segmentos: naoSalvos }),
      keepalive: true,
    });
  }, [reuniaoId]);

  useEffect(() => {
    room.on(RoomEvent.Disconnected, finalizar);
    window.addEventListener('pagehide', finalizar);
    return () => {
      room.off(RoomEvent.Disconnected, finalizar);
      window.removeEventListener('pagehide', finalizar);
    };
  }, [finalizar, room]);

  return (
    <CabineLiveCoach
      ativo={ativo}
      estado={estado}
      sugestao={sugestao}
      fala={parcial || ultimaFala}
      parcial={Boolean(parcial)}
      falha={falha}
    />
  );
}

export function CabineLiveCoach({
  ativo,
  estado,
  sugestao,
  fala,
  parcial = false,
  falha = '',
}: {
  ativo: boolean;
  estado: EstadoCoach;
  sugestao: SugestaoLive | null;
  fala: string;
  parcial?: boolean;
  falha?: string;
}) {
  const intensidade =
    estado === 'analisando' ? styles.intenso : estado === 'escutando' ? styles.ativo : '';

  return (
    <aside className={styles.painel} aria-label="Live Coach privado">
      <header className={styles.cabecalho}>
        <span className={`${styles.estado} ${intensidade}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div>
          <p>{ativo ? 'Live Coach' : 'Memória da call'}</p>
          <span>{ROTULO_ESTADO[estado]}</span>
        </div>
        <Radio size={18} strokeWidth={1.7} aria-hidden="true" />
      </header>

      <div className={styles.pulso} aria-hidden="true">
        <span />
        <i />
      </div>

      <section className={styles.recomendacao} aria-live="polite" aria-atomic="true">
        <div className={styles.rotuloSecao}>
          <Sparkles size={15} strokeWidth={1.8} aria-hidden="true" />
          Próximo movimento
        </div>
        {sugestao ? (
          <>
            <div className={styles.metaSugestao}>
              <span>{sugestao.categoria}</span>
              <span>{sugestao.metodologia}</span>
            </div>
            <h2>{sugestao.titulo}</h2>
            <p>{sugestao.sugestao}</p>
            {sugestao.trecho_gatilho && (
              <blockquote>
                <MessageSquareQuote size={14} strokeWidth={1.8} aria-hidden="true" />“
                {sugestao.trecho_gatilho}”
              </blockquote>
            )}
          </>
        ) : (
          <div className={styles.espera}>
            <h2>{ativo ? 'Escute antes de conduzir.' : 'A conversa já está virando histórico.'}</h2>
            <p>
              {ativo
                ? 'Quando houver um sinal útil, uma única recomendação aparece aqui.'
                : 'Os trechos serão salvos na oportunidade ao encerrar.'}
            </p>
          </div>
        )}
      </section>

      <section className={styles.transcricao}>
        <div className={styles.rotuloSecao}>
          <AudioLines size={15} strokeWidth={1.8} aria-hidden="true" />
          Agora na conversa
        </div>
        <p className={parcial ? styles.falaParcial : undefined}>{fala}</p>
        {falha && <small role="status">{falha}</small>}
      </section>

      <footer>
        <LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" />
        Somente você vê esta cabine
      </footer>
    </aside>
  );
}

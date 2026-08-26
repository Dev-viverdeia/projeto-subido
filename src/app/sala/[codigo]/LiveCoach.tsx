'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext, useTracks } from '@livekit/components-react';
import { ConnectionState, RoomEvent, Track, type Participant } from 'livekit-client';
import type { SegmentoLive } from '@/lib/calls/coach-schema';
import {
  CabineLiveCoach,
  type EstadoCoach,
  type EstadoGravacao,
  type EstadoGravacaoUi,
  type SugestaoLive,
} from './CabineLiveCoach';

export { CabineLiveCoach, type SugestaoLive } from './CabineLiveCoach';

type EventoRealtime = {
  type?: string;
  item_id?: string;
  previous_item_id?: string | null;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};

export function LiveCoach({ reuniaoId, ativo }: { reuniaoId: string; ativo: boolean }) {
  const room = useRoomContext();
  const referencias = useTracks([Track.Source.Microphone]);
  const [estado, setEstado] = useState<EstadoCoach>('conectando');
  const [sugestao, setSugestao] = useState<SugestaoLive | null>(null);
  const [parcial, setParcial] = useState('');
  const [ultimaFala, setUltimaFala] = useState('Aguardando a primeira fala…');
  const [falha, setFalha] = useState('');
  const [gravacao, setGravacao] = useState<EstadoGravacaoUi>('iniciando');
  const [versaoFila, setVersaoFila] = useState(0);
  const inicioRef = useRef<number | null>(null);
  const ordinalRef = useRef(0);
  const ordemItensRef = useRef(new Map<string, number>());
  const segmentosRef = useRef(new Map<string, SegmentoLive>());
  const pendentesRef = useRef<SegmentoLive[]>([]);
  const parciaisRef = useRef(new Map<string, string>());
  const envioRef = useRef(false);
  const finalizadaRef = useRef(false);
  const gravacaoIniciadaRef = useRef(false);
  const falanteAtualRef = useRef<Pick<SegmentoLive, 'falanteNome' | 'falantePapel'> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const destinoRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const fontesRef = useRef(new Map<string, MediaStreamAudioSourceNode>());
  const trilhasRef = useRef<MediaStreamTrack[]>([]);
  const canalRealtimeRef = useRef<RTCDataChannel | null>(null);
  const falaEmCursoRef = useRef(false);
  const silencioRef = useRef<number | null>(null);

  const trilhas = referencias
    .map((referencia) => referencia.publication?.track?.mediaStreamTrack)
    .filter((trilha): trilha is MediaStreamTrack => Boolean(trilha));
  const assinaturaTrilhas = trilhas
    .map((trilha) => trilha.id)
    .sort()
    .join('|');
  const temTrilha = Boolean(assinaturaTrilhas);

  useEffect(() => {
    trilhasRef.current = trilhas;
    // A assinatura muda somente quando uma mídia real entra ou sai da mistura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinaturaTrilhas]);

  const confirmarTrecho = useCallback(() => {
    const canal = canalRealtimeRef.current;
    if (!canal || canal.readyState !== 'open') return;
    if (!falaEmCursoRef.current && parciaisRef.current.size === 0) return;
    canal.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    falaEmCursoRef.current = false;
  }, []);

  useEffect(() => {
    function acompanharFalante(falantes: Participant[]) {
      const participante = falantes[0];
      if (!participante) {
        if (!falaEmCursoRef.current) return;
        if (silencioRef.current) window.clearTimeout(silencioRef.current);
        silencioRef.current = window.setTimeout(confirmarTrecho, 850);
        return;
      }
      falaEmCursoRef.current = true;
      if (silencioRef.current) window.clearTimeout(silencioRef.current);
      falanteAtualRef.current = {
        falanteNome: participante.name || 'Participante',
        falantePapel: participante.identity.startsWith('host-') ? 'anfitriao' : 'convidado',
      };
    }

    room.on(RoomEvent.ActiveSpeakersChanged, acompanharFalante);
    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, acompanharFalante);
      if (silencioRef.current) window.clearTimeout(silencioRef.current);
    };
  }, [confirmarTrecho, room]);

  useEffect(() => {
    async function iniciar() {
      if (gravacaoIniciadaRef.current) return;
      gravacaoIniciadaRef.current = true;
      setGravacao('iniciando');
      try {
        const response = await fetch(`/api/calls/${reuniaoId}/gravacao`, { method: 'POST' });
        const resultado = (await response.json().catch(() => null)) as {
          status?: EstadoGravacao;
        } | null;
        if (!response.ok || !resultado?.status) throw new Error('Gravação indisponível.');
        setGravacao(resultado.status);
      } catch {
        setGravacao('indisponivel');
      }
    }

    const aoConectar = () => void iniciar();
    room.on(RoomEvent.Connected, aoConectar);
    if (room.state === ConnectionState.Connected) void iniciar();
    return () => {
      room.off(RoomEvent.Connected, aoConectar);
    };
  }, [reuniaoId, room]);

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
      setFalha(
        erro instanceof Error ? erro.message : 'A inteligência da reunião foi interrompida.',
      );
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
        ...(falanteAtualRef.current ?? {}),
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
    if (!temTrilha) return;
    let cancelado = false;
    let peer: RTCPeerConnection | null = null;
    let audioContext: AudioContext | null = null;
    let fechamentoPeriodico: number | null = null;
    const fontesAtivas = fontesRef.current;

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
        audioContextRef.current = audioContext;
        destinoRef.current = destino;
        for (const trilha of trilhasRef.current) {
          const fonte = audioContext.createMediaStreamSource(new MediaStream([trilha]));
          fonte.connect(destino);
          fontesAtivas.set(trilha.id, fonte);
        }
        const trilhaMista = destino.stream.getAudioTracks()[0];
        if (!trilhaMista) throw new Error('O áudio da reunião ainda não está disponível.');

        peer = new RTCPeerConnection();
        peer.addTrack(trilhaMista, destino.stream);
        const canal = peer.createDataChannel('oai-events');
        canalRealtimeRef.current = canal;
        canal.addEventListener('open', () => !cancelado && setEstado('escutando'));
        canal.addEventListener('message', (mensagem) => {
          try {
            registrarEvento(JSON.parse(String(mensagem.data)) as EventoRealtime);
          } catch {
            // Eventos que não são JSON não carregam transcrição e podem ser ignorados.
          }
        });

        // Protege calls longas ou com ruído constante, nas quais o evento de
        // silêncio do LiveKit pode não chegar. O texto parcial já exibido vira
        // um segmento definitivo sem interromper a captura do áudio seguinte.
        fechamentoPeriodico = window.setInterval(confirmarTrecho, 9_000);

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
      confirmarTrecho();
      canalRealtimeRef.current = null;
      if (fechamentoPeriodico) window.clearInterval(fechamentoPeriodico);
      peer?.close();
      for (const fonte of fontesAtivas.values()) fonte.disconnect();
      fontesAtivas.clear();
      audioContextRef.current = null;
      destinoRef.current = null;
      void audioContext?.close();
    };
  }, [confirmarTrecho, registrarEvento, reuniaoId, temTrilha]);

  useEffect(() => {
    const audioContext = audioContextRef.current;
    const destino = destinoRef.current;
    if (!audioContext || !destino) return;

    const idsAtuais = new Set(trilhas.map((trilha) => trilha.id));
    for (const [id, fonte] of fontesRef.current) {
      if (idsAtuais.has(id)) continue;
      fonte.disconnect();
      fontesRef.current.delete(id);
    }

    for (const trilha of trilhas) {
      if (fontesRef.current.has(trilha.id)) continue;
      const fonte = audioContext.createMediaStreamSource(new MediaStream([trilha]));
      fonte.connect(destino);
      fontesRef.current.set(trilha.id, fonte);
    }
    // A assinatura muda somente quando uma mídia real entra ou sai da mistura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinaturaTrilhas]);

  const finalizar = useCallback(() => {
    if (finalizadaRef.current) return;
    finalizadaRef.current = true;
    const naoSalvos = [...segmentosRef.current.values()]
      .sort((a, b) => a.ordinal - b.ordinal)
      .slice(-24);
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
      gravacao={gravacao}
    />
  );
}

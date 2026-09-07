'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type EscolhasMidia = {
  audio: boolean;
  video: boolean;
  microfoneId: string;
  cameraId: string;
};
type Tipo = 'audio' | 'video';
export const MIDIA_INICIAL: EscolhasMidia = {
  audio: false,
  video: false,
  microfoneId: '',
  cameraId: '',
};

export function orientacaoMidia(erro: unknown, tipo: Tipo) {
  const nome = tipo === 'audio' ? 'o microfone' : 'a câmera';
  const codigo = erro && typeof erro === 'object' && 'name' in erro ? erro.name : '';
  if (codigo === 'NotAllowedError' || codigo === 'SecurityError') {
    return `Permita ${nome} nas configurações deste site e tente novamente.`;
  }
  if (codigo === 'NotFoundError' || codigo === 'OverconstrainedError') {
    return `Não encontramos ${nome}. Conecte o dispositivo ou escolha outro.`;
  }
  if (codigo === 'NotReadableError' || codigo === 'AbortError') {
    return `Outro aplicativo pode estar usando ${nome}. Feche-o e tente novamente.`;
  }
  return `Não foi possível ativar ${nome}. Confira as permissões e tente novamente.`;
}

/** Prévia local: nenhuma conexão com a reunião ou gravação acontece aqui. */
export function usePreparacaoMidia() {
  const [escolhas, setEscolhas] = useState<EscolhasMidia>(MIDIA_INICIAL);
  const [streams, setStreams] = useState<Record<Tipo, MediaStream | null>>({
    audio: null,
    video: null,
  });
  const [ocupado, setOcupado] = useState({ audio: false, video: false });
  const [erros, setErros] = useState({ audio: '', video: '' });
  const [dispositivos, setDispositivos] = useState<MediaDeviceInfo[]>([]);
  const ativos = useRef<Record<Tipo, MediaStream | null>>({ audio: null, video: null });
  const versao = useRef({ audio: 0, video: 0 });
  const montado = useRef(true);

  const listar = useCallback(async () => {
    try {
      const lista = await navigator.mediaDevices?.enumerateDevices();
      if (montado.current && lista) setDispositivos(lista);
    } catch {
      /* A seleção padrão continua disponível sem enumeração. */
    }
  }, []);

  const liberar = useCallback(() => {
    for (const tipo of ['audio', 'video'] as const) {
      versao.current[tipo] += 1;
      ativos.current[tipo]?.getTracks().forEach((track) => track.stop());
      ativos.current[tipo] = null;
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    const dispositivos = navigator.mediaDevices;
    const atualizar = () => {
      void listar();
    };
    dispositivos?.addEventListener('devicechange', atualizar);
    return () => {
      montado.current = false;
      dispositivos?.removeEventListener('devicechange', atualizar);
      liberar();
    };
  }, [liberar, listar]);

  async function ativar(tipo: Tipo, id = '') {
    const tentativa = ++versao.current[tipo];
    ativos.current[tipo]?.getTracks().forEach((track) => track.stop());
    ativos.current[tipo] = null;
    setStreams((atual) => ({ ...atual, [tipo]: null }));
    setEscolhas((atual) => ({ ...atual, [tipo]: false }));
    setOcupado((atual) => ({ ...atual, [tipo]: true }));
    setErros((atual) => ({ ...atual, [tipo]: '' }));
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Midia indisponível');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio:
          tipo === 'audio'
            ? {
                ...(id ? { deviceId: { exact: id } } : {}),
                echoCancellation: true,
                noiseSuppression: true,
              }
            : false,
        video:
          tipo === 'video'
            ? {
                ...(id ? { deviceId: { exact: id } } : {}),
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
      });
      if (!montado.current || tentativa !== versao.current[tipo]) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      ativos.current[tipo] = stream;
      setStreams((atual) => ({ ...atual, [tipo]: stream }));
      const track = stream.getTracks()[0];
      setEscolhas((atual) => ({
        ...atual,
        [tipo]: true,
        [tipo === 'audio' ? 'microfoneId' : 'cameraId']: track?.getSettings().deviceId ?? id,
      }));
      track?.addEventListener(
        'ended',
        () => {
          if (!montado.current || tentativa !== versao.current[tipo]) return;
          setEscolhas((atual) => ({ ...atual, [tipo]: false }));
          setStreams((atual) => ({ ...atual, [tipo]: null }));
          setErros((atual) => ({
            ...atual,
            [tipo]: `O dispositivo foi desconectado. Conecte novamente e ative ${tipo === 'audio' ? 'o microfone' : 'a câmera'}.`,
          }));
        },
        { once: true },
      );
      await listar();
    } catch (erro) {
      if (montado.current && tentativa === versao.current[tipo]) {
        setErros((atual) => ({ ...atual, [tipo]: orientacaoMidia(erro, tipo) }));
      }
    } finally {
      if (montado.current && tentativa === versao.current[tipo])
        setOcupado((atual) => ({ ...atual, [tipo]: false }));
    }
  }

  function desligar(tipo: Tipo) {
    versao.current[tipo] += 1;
    ativos.current[tipo]?.getTracks().forEach((track) => track.stop());
    ativos.current[tipo] = null;
    setStreams((atual) => ({ ...atual, [tipo]: null }));
    setEscolhas((atual) => ({ ...atual, [tipo]: false }));
    setOcupado((atual) => ({ ...atual, [tipo]: false }));
  }

  function selecionar(tipo: Tipo, id: string) {
    setEscolhas((atual) => ({ ...atual, [tipo === 'audio' ? 'microfoneId' : 'cameraId']: id }));
    if (escolhas[tipo]) void ativar(tipo, id);
  }

  return { escolhas, streams, ocupado, erros, dispositivos, ativar, desligar, selecionar, liberar };
}

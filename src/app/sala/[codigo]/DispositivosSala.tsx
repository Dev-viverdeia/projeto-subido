'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { ChevronDown, Settings2 } from 'lucide-react';
import type { EscolhasMidia } from './usePreparacaoMidia';
import styles from './PalcoReuniao.module.css';

type Props = {
  escolhas: EscolhasMidia;
  aoMudarEscolhas: Dispatch<SetStateAction<EscolhasMidia>>;
  aoFalhar: (erro: Error, tipo?: MediaDeviceKind) => void;
};

export function DispositivosSala({ escolhas, aoMudarEscolhas, aoFalhar }: Props) {
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

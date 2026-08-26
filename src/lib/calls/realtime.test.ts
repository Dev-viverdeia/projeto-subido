import { describe, expect, it } from 'vitest';
import { criarSessaoTranscricao } from './realtime';

describe('sessão de transcrição em tempo real', () => {
  it('usa o contrato de streaming recomendado para WebRTC', () => {
    const sessao = criarSessaoTranscricao({ prompt: 'Reunião comercial em português.' });

    expect(sessao).toMatchObject({
      type: 'transcription',
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24_000 },
          transcription: {
            model: 'gpt-live-transcribe',
            prompt: 'Reunião comercial em português.',
            languages: ['pt'],
            delay: 'low',
          },
          turn_detection: { type: 'server_vad' },
        },
      },
    });
    expect(sessao.audio.input.transcription).not.toHaveProperty('language');
  });
});

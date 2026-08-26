type ContextoTranscricao = {
  prompt: string;
};

/**
 * Contrato da sessão de legenda ao vivo.
 *
 * Fica isolado da rota para que mudanças do protocolo da OpenAI sejam
 * validadas por teste antes de chegarem à sala de reunião.
 */
export function criarSessaoTranscricao({ prompt }: ContextoTranscricao) {
  return {
    type: 'transcription' as const,
    audio: {
      input: {
        format: {
          type: 'audio/pcm' as const,
          rate: 24_000,
        },
        noise_reduction: { type: 'far_field' as const },
        transcription: {
          model: 'gpt-live-transcribe',
          prompt,
          keywords: ['inteligência artificial', 'IA', 'SDR', 'CRM', 'WhatsApp', 'automação'],
          languages: ['pt'],
          delay: 'low' as const,
        },
        turn_detection: {
          type: 'server_vad' as const,
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 700,
        },
      },
    },
  };
}

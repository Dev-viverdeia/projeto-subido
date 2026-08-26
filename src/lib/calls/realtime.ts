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
        // O modelo de legenda contínua recebe o fechamento de cada trecho pelo
        // data channel. Hoje ele rejeita o VAD do servidor nesta modalidade.
        turn_detection: null,
      },
    },
  };
}

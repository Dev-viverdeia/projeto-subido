import type { SegmentoLive } from '@/lib/calls/coach-schema';

export async function obterCredenciaisSala(codigo: string, nome: string, consentiu: boolean) {
  const response = await fetch('/api/calls/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, nome: nome.trim(), consentiu }),
  });
  const resultado = (await response.json()) as {
    erro?: string;
    server_url?: string;
    participant_token?: string;
  };
  if (!response.ok || !resultado.server_url || !resultado.participant_token) {
    throw new Error(resultado.erro || 'Não foi possível abrir a sala.');
  }
  return { serverUrl: resultado.server_url, token: resultado.participant_token };
}

export async function salvarSaida(
  reuniaoId: string,
  segmentos: SegmentoLive[] = [],
  encerrar = false,
) {
  const resposta = await fetch(`/api/calls/${reuniaoId}/finalizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segmentos, encerrar }),
    keepalive: true,
  });
  if (!resposta.ok) throw new Error('Não foi possível confirmar o encerramento. Tente novamente.');
}

'use client';

export const PREFIXO_POSICAO_ROTEIRO = 'subido-roteiro-sala:';
const EVENTO = 'subido:posicao-roteiro';
// Só índices e enums. Não armazenar perguntas, respostas ou conteúdo do cliente.
const memoria = new Map<string, string>();
const LIMITE_MEMORIA = 32;

export function lerPosicaoLocal(reuniaoId: string): string {
  if (typeof window === 'undefined') return '';
  const chave = PREFIXO_POSICAO_ROTEIRO + reuniaoId;
  if (memoria.has(chave)) return memoria.get(chave)!;
  try {
    return sessionStorage.getItem(chave) ?? '';
  } catch {
    return '';
  }
}

export function salvarPosicaoLocal(reuniaoId: string, valor: string) {
  const chave = PREFIXO_POSICAO_ROTEIRO + reuniaoId;
  try {
    sessionStorage.setItem(chave, valor);
    memoria.delete(chave);
  } catch {
    // A navegação e a reconexão continuam funcionando com armazenamento bloqueado.
    memoria.delete(chave);
    memoria.set(chave, valor);
    if (memoria.size > LIMITE_MEMORIA) memoria.delete(memoria.keys().next().value!);
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function observarPosicaoLocal(onChange: () => void) {
  window.addEventListener(EVENTO, onChange);
  return () => window.removeEventListener(EVENTO, onChange);
}

/** Limpa somente os marcadores de leitura desta aba ao sair da conta. */
export function limparPosicoesRoteiro() {
  memoria.clear();
  if (typeof window === 'undefined') return;
  try {
    for (const chave of Object.keys(sessionStorage)) {
      if (chave.startsWith(PREFIXO_POSICAO_ROTEIRO)) sessionStorage.removeItem(chave);
    }
  } catch {
    // Armazenamento indisponível não pode impedir o logout.
  }
  window.dispatchEvent(new Event(EVENTO));
}

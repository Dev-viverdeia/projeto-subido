/** Não normalize chaves do Storage: uma URL normalizada pode apontar para outro dono. */
export function caminhoArquivoDoProjeto(caminho: string, dono: string, projeto: string): boolean {
  const partes = caminho.split('/');
  return (
    partes.length === 3 &&
    partes[0] === dono &&
    partes[1] === projeto &&
    Boolean(partes[2]) &&
    !/[^a-zA-Z0-9._-]/.test(partes[2] ?? '') &&
    partes[2] !== '.' &&
    partes[2] !== '..' &&
    caminho.length <= 1000
  );
}

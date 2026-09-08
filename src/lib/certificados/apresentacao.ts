/** Os registros de demonstração existentes carregam o aviso no campo nome.
 * Separa sua apresentação, sem remover a identificação nem alterar o registro.
 */
export function apresentacaoCertificado(nome: string) {
  const marcador = /\s*[—–-]\s*CERTIFICADO DE DEMONSTRAÇÃO\s*$/i;
  const demonstracao = marcador.test(nome);
  return { nome: demonstracao ? nome.replace(marcador, '').trim() : nome, demonstracao };
}

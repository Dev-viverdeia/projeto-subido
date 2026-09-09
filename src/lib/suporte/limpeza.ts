import 'server-only';
import { criarSistemaSuporte } from './servidor';

export async function limparAnexosSuporte(signal = AbortSignal.timeout(10_000)) {
  const db = criarSistemaSuporte({ signal });
  const { error } = await db.rpc('suporte_preparar_limpeza');
  if (error) throw new Error('limpeza_indisponivel');
  const { data, error: consulta } = await db
    .from('suporte_arquivos_remover')
    .select('caminho')
    .lte('liberar_em', new Date().toISOString())
    .order('criado_em')
    .limit(50);
  if (consulta) throw new Error('limpeza_indisponivel');
  if (!data?.length) return 0;
  const caminhos = data.map((a) => a.caminho);
  const { error: storage } = await db.storage.from('suporte-privado').remove(caminhos);
  if (storage) throw new Error('limpeza_arquivos');
  const { error: salvar } = await db
    .from('suporte_arquivos_remover')
    .delete()
    .in('caminho', caminhos);
  if (salvar) throw new Error('limpeza_registro');
  return caminhos.length;
}

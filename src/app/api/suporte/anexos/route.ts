import { z } from 'zod';
import {
  criarSistemaSuporte,
  limitarSuporte,
  mesmaOrigem,
  usuarioSuporte,
} from '@/lib/suporte/servidor';
import { MAX_ARQUIVO, tipoRealArquivo } from '@/lib/suporte/contrato';
import { corpoLimitado } from '@/lib/suporte/http';

export const runtime = 'nodejs';
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  try {
    if (!mesmaOrigem(request)) return json({ erro: 'Origem inválida.' }, 403);
    const user = await usuarioSuporte();
    if (!user) return json({ erro: 'Entre novamente para anexar.' }, 401);
    if (!(await limitarSuporte(user.id, 'upload', 30, 3600)))
      return json({ erro: 'Muitos anexos enviados. Tente mais tarde.' }, 429);
    const bytes = await corpoLimitado(request, MAX_ARQUIVO + 32_768);
    const form = await new Response(bytes as BodyInit, {
      headers: { 'Content-Type': request.headers.get('content-type') ?? '' },
    }).formData();
    const file = form.get('arquivo');
    const id = z.uuid().safeParse(form.get('id'));
    if (!(file instanceof File) || !id.success || !file.size || file.size > MAX_ARQUIVO)
      return json({ erro: 'Envie uma imagem ou PDF de até 3 MB.' }, 400);
    const buffer = new Uint8Array(await file.arrayBuffer());
    const mime = tipoRealArquivo(buffer);
    if (!mime || mime !== file.type)
      return json({ erro: 'Formato não permitido. Use PNG, JPG, WebP ou PDF.' }, 400);
    const nome =
      Array.from(file.name)
        .filter((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127 && c !== '/' && c !== '\\')
        .join('')
        .slice(0, 160) || 'Anexo';
    const caminho = `${user.id}/${id.data}`;
    const db = criarSistemaSuporte();
    const { data: existente, error: consulta } = await db
      .from('suporte_arquivos')
      .select('id,nome,bytes,mime,dono')
      .eq('id', id.data)
      .maybeSingle();
    if (consulta) throw consulta;
    if (existente)
      return existente.dono === user.id
        ? json({
            arquivo: {
              id: existente.id,
              nome: existente.nome,
              bytes: existente.bytes,
              mime: existente.mime,
            },
          })
        : json({ erro: 'Não foi possível anexar.' }, 409);
    const { error: upload } = await db.storage
      .from('suporte-privado')
      .upload(caminho, buffer, { contentType: mime, upsert: false });
    if (upload) return json({ erro: 'O arquivo não foi enviado. Tente novamente.' }, 503);
    const arquivo = { id: id.data, nome, bytes: file.size, mime };
    const { error } = await db
      .from('suporte_arquivos')
      .insert({ ...arquivo, dono: user.id, caminho });
    if (error) {
      await db.storage.from('suporte-privado').remove([caminho]);
      throw error;
    }
    return json({ arquivo });
  } catch {
    return json(
      { erro: 'Não foi possível anexar. Use um arquivo de até 3 MB e tente novamente.' },
      400,
    );
  }
}

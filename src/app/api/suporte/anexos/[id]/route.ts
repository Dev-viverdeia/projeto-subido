import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { acessoPublico, criarSistemaSuporte, usuarioSuporte } from '@/lib/suporte/servidor';

export async function GET(request: Request, { params }: RouteContext<'/api/suporte/anexos/[id]'>) {
  const { id } = await params;
  const negar = () =>
    new Response('Arquivo indisponível.', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    });
  if (!z.uuid().safeParse(id).success) return negar();
  try {
    const user = await usuarioSuporte();
    let arquivo;
    if (user) {
      const db = await createClient();
      const { data } = await db
        .from('suporte_arquivos')
        .select('caminho,nome,mime')
        .eq('id', id)
        .maybeSingle();
      arquivo = data;
    }
    if (!arquivo) {
      const caso = new URL(request.url).searchParams.get('atendimento');
      if (!z.uuid().safeParse(caso).success || !caso || !(await acessoPublico(caso)))
        return negar();
      const db = criarSistemaSuporte();
      const { data } = await db
        .from('suporte_arquivos')
        .select('caminho,nome,mime,suporte_mensagens!inner(atendimento,interna)')
        .eq('id', id)
        .eq('suporte_mensagens.atendimento', caso)
        .eq('suporte_mensagens.interna', false)
        .maybeSingle();
      arquivo = data;
    }
    if (!arquivo) return negar();
    const { data, error } = await criarSistemaSuporte()
      .storage.from('suporte-privado')
      .download(arquivo.caminho);
    if (error || !data) return negar();
    return new Response(data, {
      headers: {
        'Content-Type': arquivo.mime,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(arquivo.nome)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "sandbox; default-src 'none'",
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch {
    return negar();
  }
}

import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { env } from '@/lib/env';
import {
  criarSistemaSuporte,
  limitarSuporte,
  mesmaOrigem,
  hashAcesso,
  ipSuporte,
} from '@/lib/suporte/servidor';
import { jsonLimitado } from '@/lib/suporte/http';

const Pedido = z.object({
  id: z.uuid().optional(),
  email: z.email().max(254),
  assunto: z.string().trim().min(3).max(120),
  texto: z.string().trim().min(10).max(6000),
  site: z.string().max(200).default(''),
  atendimento: z.uuid().optional(),
});
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const recebido = () =>
  json({
    ok: true,
    mensagem:
      'Confira seu e-mail para confirmar e acompanhar o pedido. O link pode levar alguns minutos.',
  });
export async function POST(request: Request) {
  try {
    if (!mesmaOrigem(request)) return json({ erro: 'Origem inválida.' }, 403);
    const p = Pedido.safeParse(await jsonLimitado(request));
    if (!p.success) return json({ erro: 'Confira o e-mail e descreva o problema.' }, 400);
    if (p.data.site) return recebido();
    if (
      !(await limitarSuporte(ipSuporte(request), 'publico-ip', 8, 3600)) ||
      !(await limitarSuporte('geral', 'publico-dia', 500, 86400)) ||
      !(await limitarSuporte(p.data.email.toLowerCase(), 'publico-email', 3, 3600))
    )
      return json(
        { erro: 'Muitas tentativas. Confira sua caixa de entrada ou tente mais tarde.' },
        429,
      );
    const db = criarSistemaSuporte();
    const token = randomBytes(32).toString('hex');
    const id = p.data.atendimento ?? p.data.id ?? crypto.randomUUID();
    const url = new URL('/api/suporte/acesso', env.NEXT_PUBLIC_SITE_URL);
    url.searchParams.set('id', id);
    url.searchParams.set('chave', token);
    if (p.data.atendimento) {
      const { data, error } = await db
        .from('suporte_atendimentos')
        .select('id')
        .eq('id', id)
        .is('dono', null)
        .eq('email', p.data.email.trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const { error: salvar } = await db.rpc('suporte_publico_renovar', {
          p_id: id,
          p_email: p.data.email.trim().toLowerCase(),
          p_hash: hashAcesso(token),
          p_url: url.toString(),
        });
        if (salvar) throw salvar;
      }
    } else {
      const { error } = await db.rpc('suporte_publico_criar', {
        p_id: id,
        p_email: p.data.email,
        p_assunto: p.data.assunto,
        p_texto: p.data.texto,
        p_hash: hashAcesso(token),
        p_url: url.toString(),
      });
      if (error) throw error;
    }
    return recebido();
  } catch {
    return json(
      { erro: 'Não foi possível registrar o pedido agora. Seu texto pode ser reenviado.' },
      503,
    );
  }
}

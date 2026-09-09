import { Resend } from 'resend';
import { z } from 'zod';
import { suporteEmailEnv } from '@/lib/env';
import { corpoLimitado } from '@/lib/suporte/http';
import { criarSistemaSuporte } from '@/lib/suporte/servidor';
import { caixaPostal, casoDoEndereco } from '@/lib/suporte/email-contrato';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const config = suporteEmailEnv();
  if (!config) return Response.json({ erro: 'indisponivel' }, { status: 503 });
  let evento;
  try {
    evento = new Resend(config.api).webhooks.verify({
      payload: new TextDecoder().decode(await corpoLimitado(request, 64_000)),
      headers: {
        id: request.headers.get('svix-id') ?? '',
        timestamp: request.headers.get('svix-timestamp') ?? '',
        signature: request.headers.get('svix-signature') ?? '',
      },
      webhookSecret: config.webhook,
    });
  } catch {
    return Response.json({ erro: 'assinatura_invalida' }, { status: 400 });
  }
  if (evento.type !== 'email.received') return Response.json({ recebido: true });
  const id = z.uuid().safeParse(evento.data.email_id);
  if (!id.success) return Response.json({ erro: 'evento_invalido' }, { status: 400 });
  const destinos = evento.data.to.map(caixaPostal).filter((d): d is string => !!d);
  if (
    !destinos.some(
      (d) => !!casoDoEndereco(d, config.dominio, config.chave) || d === `ajuda@${config.dominio}`,
    )
  )
    return Response.json({ recebido: true });
  // FK só depois de consultar o caso; nenhum dado de ticket sai deste endpoint.
  const { error } = await criarSistemaSuporte()
    .from('suporte_email_recebidos')
    .upsert({ id: id.data }, { onConflict: 'id', ignoreDuplicates: true });
  return error
    ? Response.json({ erro: 'fila_indisponivel' }, { status: 503 })
    : Response.json({ recebido: true });
}

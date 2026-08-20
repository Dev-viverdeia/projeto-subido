import { randomUUID } from 'node:crypto';
import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registrarEntradaNaSala } from '@/lib/calls/admin';
import { obterContextoDaSala } from '@/lib/calls/queries';
import { callPodeAbrir } from '@/lib/calls/tipos';
import { livekitEnv } from '@/lib/env';

const requisicaoSchema = z.object({
  codigo: z.uuid(),
  nome: z.string().trim().min(1).max(160),
  consentiu: z.literal(true),
});

function resposta(erro: string, status: number) {
  return NextResponse.json({ erro }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

/**
 * Endpoint de produção recomendado pelo LiveKit: a chave nunca chega ao cliente
 * e todos os campos com poder (sala, identidade e permissões) são decididos aqui,
 * a partir do código validado no banco — não a partir do corpo enviado pelo browser.
 */
export async function POST(request: Request) {
  const corpo = requisicaoSchema.safeParse(await request.json().catch(() => null));
  if (!corpo.success) return resposta('Confira seu nome e o consentimento para continuar.', 400);

  const [contexto, configuracao] = await Promise.all([
    obterContextoDaSala(corpo.data.codigo),
    Promise.resolve(livekitEnv()),
  ]);

  if (!contexto) return resposta('Esta sala não existe ou o link não é mais válido.', 404);
  if (!callPodeAbrir(contexto.convite.status))
    return resposta('Esta reunião já foi encerrada.', 409);
  if (!contexto.anfitriao && !contexto.convite.disponivel) {
    return resposta('A sala abre 30 minutos antes do horário agendado.', 409);
  }
  if (!configuracao) {
    return resposta('A infraestrutura de vídeo ainda está em ativação.', 503);
  }

  const identidade =
    contexto.anfitriao && contexto.usuarioId
      ? `host-${contexto.usuarioId}`
      : `guest-${randomUUID()}`;

  const token = new AccessToken(configuracao.LIVEKIT_API_KEY, configuracao.LIVEKIT_API_SECRET, {
    identity: identidade,
    name: corpo.data.nome,
    ttl: '2h',
    metadata: JSON.stringify({
      reuniaoId: contexto.convite.reuniaoId,
      papel: contexto.anfitriao ? 'anfitriao' : 'convidado',
    }),
  });
  token.addGrant({
    room: contexto.convite.salaProvedor,
    roomJoin: true,
    roomAdmin: contexto.anfitriao,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  try {
    await registrarEntradaNaSala({
      dono: contexto.dono,
      reuniaoId: contexto.convite.reuniaoId,
      papel: contexto.anfitriao ? 'anfitriao' : 'convidado',
      nome: corpo.data.nome,
      identidade,
    });
  } catch (error) {
    console.error('[calls:entrada] Falha ao registrar participante.', error);
    return resposta('Não foi possível confirmar o acesso à sala.', 409);
  }

  return NextResponse.json(
    {
      server_url: configuracao.LIVEKIT_URL,
      participant_token: await token.toJwt(),
    },
    { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
  );
}

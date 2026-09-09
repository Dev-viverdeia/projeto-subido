import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { setTimeout as esperar } from 'node:timers/promises';
import { ResendSuporte } from './resend-worker';
import { env, suporteEmailEnv } from '@/lib/env';
import { corpoLimitado } from './http';
import { criarSistemaSuporte, hashAcesso, limitarSuporte } from './servidor';
import {
  caixaPostal,
  casoDoEndereco,
  idMensagemSeguro,
  respostaAutomatica,
  textoResposta,
} from './email-contrato';
import { remetenteAutentico } from './email-autenticidade';
import { MAX_ARQUIVO, tipoRealArquivo } from './contrato';

async function baixar(url: string, limite: number, signal: AbortSignal) {
  // Apenas URLs retornadas pela API autenticada, nunca links do corpo do e-mail.
  const u = new URL(url);
  if (u.protocol !== 'https:' || u.username || u.password) throw new Error('url_invalida');
  const r = await fetch(u, {
    redirect: 'error',
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
  });
  if (!r.ok) throw new Error('download');
  return corpoLimitado(
    new Request(u, { method: 'POST', body: r.body, duplex: 'half' } as RequestInit),
    limite,
  );
}
function uuidArquivo(email: string, id: string) {
  const h = createHash('sha256').update(`${email}:${id}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export async function processarEmailsSuporte(signal = AbortSignal.timeout(55_000)) {
  signal.throwIfAborted();
  const config = suporteEmailEnv();
  if (!config) return { incorporados: 0, revisao: 0, falhasRecebimento: 0 };
  const db = criarSistemaSuporte({ signal });
  const resend = new ResendSuporte(config.api, signal);
  const { data: fila, error } = await db.rpc('suporte_email_reservar');
  if (error) throw new Error('fila_email');
  let incorporados = 0,
    revisao = 0,
    falhasRecebimento = 0;
  for (const item of fila ?? []) {
    signal.throwIfAborted();
    const situacao = async (
      estado: 'revisao' | 'ignorado' | 'falhou',
      motivo: string,
      atendimento?: string,
    ) => {
      const { error: erro } = await db
        .from('suporte_email_recebidos')
        .update({
          estado,
          motivo,
          ...(atendimento ? { atendimento } : {}),
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('estado', 'processando');
      if (erro) throw erro;
    };
    try {
      await esperar(600, undefined, { signal });
      const { data: email, error: erro } = await resend.emails.receiving.get(item.id, {
        html_format: 'cid',
      });
      if (erro || !email) throw new Error('provedor');
      if (respostaAutomatica(email.headers)) {
        await situacao('ignorado', 'Resposta automática.');
        continue;
      }
      const remetente = caixaPostal(email.from);
      const destinos = (email.received_for.length ? email.received_for : email.to)
        .map(caixaPostal)
        .filter((d): d is string => !!d);
      const casos = [
        ...new Set(
          destinos
            .map((d) => casoDoEndereco(d, config.dominio, config.chave))
            .filter((id): id is string => !!id),
        ),
      ];
      const novo = casos.length === 0 && destinos.includes(`ajuda@${config.dominio}`);
      if (!remetente || casos.length > 1 || (!novo && !casos.length)) {
        await situacao('ignorado', 'Destinatário não reconhecido.');
        continue;
      }
      const caso = casos[0];
      if (caso) {
        const { data: a } = await db
          .from('suporte_atendimentos')
          .select('email,verificado')
          .eq('id', caso)
          .maybeSingle();
        if (!a?.verificado || a.email.toLowerCase() !== remetente) {
          await situacao('revisao', 'Remetente diferente do cliente.');
          revisao++;
          continue;
        }
      }
      if (!email.raw?.download_url) throw new Error('original_indisponivel');
      const raw = Buffer.from(await baixar(email.raw.download_url, 14_000_000, signal));
      if (!(await remetenteAutentico(raw, remetente))) {
        await situacao('revisao', 'Não foi possível confirmar a autenticidade do remetente.', caso);
        revisao++;
        continue;
      }
      if (
        (novo && !(await limitarSuporte('entrada-email', 'novos-total', 100, 3600, signal))) ||
        !(await limitarSuporte(
          remetente,
          novo ? 'email-novo' : 'email-resposta',
          novo ? 8 : 60,
          3600,
          signal,
        ))
      ) {
        await situacao('revisao', 'Limite de mensagens atingido.', caso);
        revisao++;
        continue;
      }
      // HTML puro fica na revisão. Nunca renderizar HTML remoto nem carregar rastreadores.
      if (!email.text?.trim()) {
        await situacao('revisao', 'Mensagem sem versão de texto. Consulte o original.', caso);
        revisao++;
        continue;
      }
      const texto = textoResposta(email.text);
      if (texto.length > 5400) {
        await situacao(
          'revisao',
          'Mensagem longa. Consulte o original para não perder conteúdo.',
          caso,
        );
        revisao++;
        continue;
      }
      const anexos = [];
      let recusados = 0;
      for (const [indice, arquivo] of email.attachments.entries()) {
        if (
          indice >= 3 ||
          arquivo.size > MAX_ARQUIVO ||
          !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(
            arquivo.content_type,
          )
        ) {
          recusados++;
          continue;
        }
        await esperar(600, undefined, { signal });
        const { data: anexo, error: erroAnexo } = await resend.emails.receiving.attachments.get({
          emailId: item.id,
          id: arquivo.id,
        });
        if (erroAnexo || !anexo) throw new Error('anexo_provedor');
        const bytes = await baixar(anexo.download_url, MAX_ARQUIVO, signal);
        const mime = tipoRealArquivo(bytes);
        if (!mime || mime !== arquivo.content_type || !bytes.length) {
          recusados++;
          continue;
        }
        const id = uuidArquivo(item.id, arquivo.id),
          caminho = `email/${item.id}/${id}`;
        const { error: preparar } = await db
          .from('suporte_arquivos_remover')
          .upsert(
            { caminho, liberar_em: new Date(Date.now() + 86400000).toISOString() },
            { onConflict: 'caminho' },
          );
        if (preparar) throw preparar;
        const { error: upload } = await db.storage
          .from('suporte-privado')
          .upload(caminho, bytes, { contentType: mime, upsert: true });
        if (upload) throw upload;
        const nome =
          Array.from(arquivo.filename ?? 'Anexo')
            .filter(
              (c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127 && c !== '/' && c !== '\\',
            )
            .join('')
            .slice(0, 160) || 'Anexo';
        anexos.push({ id, caminho, nome, mime, bytes: bytes.length });
      }
      const completo =
        texto +
        (recusados
          ? `\n\n[${recusados} anexo(s) não aceito(s). Envie até 3 imagens ou PDFs de até 3 MB pela plataforma.]`
          : '');
      const messageId = idMensagemSeguro(email.message_id) ?? '';
      if (novo) {
        const token = randomBytes(32).toString('hex');
        const link = new URL('/api/suporte/acesso', env.NEXT_PUBLIC_SITE_URL);
        link.searchParams.set('id', item.id);
        link.searchParams.set('chave', token);
        const { error: salvar } = await db.rpc('suporte_email_novo', {
          p_email: item.id,
          p_remetente: remetente,
          p_assunto: email.subject.trim().slice(0, 120) || 'Pedido de ajuda por e-mail',
          p_texto: completo,
          p_hash: hashAcesso(token),
          p_url: link.toString(),
          p_message_id: messageId,
          p_anexos: anexos,
        });
        if (salvar) throw salvar;
      } else if (caso) {
        const { error: salvar } = await db.rpc('suporte_email_incorporar', {
          p_email: item.id,
          p_atendimento: caso,
          p_remetente: remetente,
          p_texto: completo,
          p_message_id: messageId,
          p_anexos: anexos,
        });
        if (salvar) throw salvar;
      }
      incorporados++;
    } catch {
      signal.throwIfAborted();
      await situacao('falhou', 'Não foi possível processar. O original continua no provedor.');
      falhasRecebimento++;
    }
  }
  return { incorporados, revisao, falhasRecebimento };
}

/** QA opt-in, somente com a conta descartável criada pelo smoke. */
/* global document, innerWidth */
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { expect as expectBase } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const expect = expectBase.configure({ timeout: 30_000 });
const exigir = (r) => {
  if (r.error) throw new Error(`QA notificações: ${r.error.code}`);
  return r.data;
};

export async function validarNotificacoesEntrega({
  app,
  admin,
  client,
  browser,
  page,
  usuario,
  entregaId,
  pasta,
  erros,
}) {
  const destinatario = process.env.SUBIDO_QA_EMAIL;
  if (!['rafael@viverdeia.ai', 'delivered@resend.dev'].includes(destinatario))
    throw new Error('Destinatário de QA não autorizado.');
  const tarefa = exigir(
    await client
      .from('projeto_tarefas')
      .select('id,titulo')
      .eq('projeto_execucao_id', entregaId)
      .order('ordem')
      .limit(1)
      .single(),
  );
  const projeto = exigir(
    await admin
      .from('projetos_execucao')
      .update({ portal_ativo: true })
      .eq('id', entregaId)
      .eq('dono', usuario)
      .select('portal_codigo')
      .single(),
  );
  const url = `${app}/entregas/${entregaId}?tarefa=${tarefa.id}#tarefa-em-foco`;
  const contexto = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const portal = await contexto.newPage();
  portal.on('pageerror', (e) => erros.push(e.message));
  const portalUrl = `${app}/portal/${projeto.portal_codigo}#entrega-${tarefa.id}`;
  const ids = [];
  try {
    for (const decisao of ['ajustes', 'aprovada']) {
      if (decisao === 'ajustes')
        exigir(
          await admin
            .from('projeto_tarefas')
            .update({
              status: 'concluida',
              evidencia: 'Teste controlado de notificações, sem dados reais.',
            })
            .eq('id', tarefa.id)
            .eq('dono', usuario),
        );
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(url);
      await page.reload();
      await expect(page.locator('#tarefa-em-foco h2')).toHaveText(tarefa.titulo);
      if (decisao === 'aprovada') {
        await page
          .getByLabel('Como você testou o ajuste?')
          .fill('Texto revisado e validado no teste de QA.');
        await page.getByRole('checkbox', { name: /Revisei o resultado/ }).check();
        await page.getByRole('button', { name: 'Concluir ajuste', exact: true }).click();
      }
      await page.getByLabel('E-mail que receberá a validação').fill(destinatario);
      await page
        .getByLabel('Mensagem para o cliente')
        .fill(
          `Teste Subido ${entregaId.slice(0, 8)}: revisão ${decisao}. Pode ignorar este e-mail de QA.`,
        );
      await page.getByRole('button', { name: 'Enviar para validação', exact: true }).click();
      await expect(page.getByText('Agora é com o cliente.', { exact: true })).toBeVisible();
      const convite = exigir(
        await client
          .from('projeto_portal_eventos')
          .select('*')
          .eq('projeto_execucao_id', entregaId)
          .eq('tipo', 'aprovacao_solicitada')
          .order('criado_em', { ascending: false })
          .limit(1)
          .single(),
      );
      if (!convite.email_provider_id) throw new Error(`Convite não enviado: ${convite.email_erro}`);
      ids.push(convite.email_provider_id);
      if (new URL(app).hostname === 'subido.viverdeia.ai') {
        await expect
          .poll(
            async () =>
              exigir(
                await client
                  .from('projeto_portal_eventos')
                  .select('email_status')
                  .eq('id', convite.id)
                  .single(),
              ).email_status,
            { timeout: 45_000 },
          )
          .toBe('entregue');
        await page.getByRole('button', { name: 'Atualizar status' }).click();
        await expect(page.getByText('Entrega confirmada', { exact: true })).toBeVisible();
      }
      await page.screenshot({ path: join(pasta, `email-${decisao}-desktop.png`), fullPage: true });
      await portal.goto(portalUrl);
      // Voltar à mesma URL com âncora é uma navegação no documento no Chromium.
      await portal.reload();
      const artigo = portal.locator(`#entrega-${tarefa.id}`);
      await expect(artigo).toBeInViewport();
      if (!(await portal.evaluate(() => document.documentElement.scrollWidth <= innerWidth)))
        throw new Error('Overflow no portal.');
      const axe = await new AxeBuilder({ page: portal }).analyze();
      if (axe.violations.some((v) => ['serious', 'critical'].includes(v.impact)))
        throw new Error('Acessibilidade do portal.');
      await portal.screenshot({ path: join(pasta, `email-${decisao}-mobile.png`), fullPage: true });
      if (decisao === 'ajustes') {
        await artigo.getByRole('button', { name: 'Pedir ajuste' }).click();
        await artigo
          .getByLabel('O que precisa mudar?')
          .fill('Ajuste de QA: confirme o texto da mensagem antes do aceite.');
        await artigo.getByRole('button', { name: 'Enviar ajuste' }).click();
        await expect(
          portal.getByRole('heading', { name: 'Seu pedido de ajuste foi recebido.' }),
        ).toBeVisible();
      } else await artigo.getByRole('button', { name: 'Aprovar entrega', exact: true }).click();
      await expect
        .poll(
          async () =>
            exigir(
              await client
                .from('projeto_tarefas')
                .select('cliente_status')
                .eq('id', tarefa.id)
                .single(),
            ).cliente_status,
        )
        .toBe(decisao);
      const evento = exigir(
        await client
          .from('projeto_portal_eventos')
          .select('*')
          .eq('projeto_execucao_id', entregaId)
          .eq('tipo', decisao === 'ajustes' ? 'ajustes_solicitados' : 'entrega_aprovada')
          .order('criado_em', { ascending: false })
          .limit(1)
          .single(),
      );
      await expect
        .poll(
          async () =>
            exigir(
              await client
                .from('projeto_portal_eventos')
                .select('email_provider_id')
                .eq('id', evento.id)
                .single(),
            ).email_provider_id,
        )
        .toBeTruthy();
      const final = exigir(
        await client.from('projeto_portal_eventos').select('*').eq('id', evento.id).single(),
      );
      ids.push(final.email_provider_id);
      if (new URL(app).hostname === 'subido.viverdeia.ai') {
        await expect
          .poll(
            async () =>
              exigir(
                await client
                  .from('projeto_portal_eventos')
                  .select('email_status')
                  .eq('id', evento.id)
                  .single(),
              ).email_status,
            { timeout: 45_000 },
          )
          .toBe('entregue');
      }
      const antigo = exigir(
        await admin.rpc('projeto_email_reservar', {
          p_evento: convite.id,
          p_destinatario: destinatario,
          p_assunto: convite.email_assunto,
          p_fingerprint: convite.email_fingerprint,
        }),
      );
      if (antigo.resultado !== 'obsoleto') throw new Error('Convite respondido aceitou reenvio.');
    }
    await validarReservas({ admin, client, usuario, entregaId, tarefaId: tarefa.id });
    console.log(
      JSON.stringify({
        notificacoes: 'aprovadas',
        emails: ids,
        destinatario,
        portal: portalUrl,
        profissional: url,
        capturas: pasta,
      }),
    );
  } finally {
    await contexto.close();
  }
}

async function validarReservas({ admin, client, usuario, entregaId, tarefaId }) {
  const id = randomUUID();
  exigir(
    await admin.from('projeto_portal_eventos').insert({
      id,
      dono: usuario,
      projeto_execucao_id: entregaId,
      tarefa_id: tarefaId,
      tipo: 'entrega_aprovada',
      autor: 'cliente',
    }),
  );
  const args = {
    p_evento: id,
    p_destinatario: 'delivered@resend.dev',
    p_assunto: 'QA reserva sem disparo',
    p_fingerprint: 'a'.repeat(64),
  };
  const usuarioComum = await client.rpc('projeto_email_reservar', args);
  if (!usuarioComum.error) throw new Error('Reserva acessível ao navegador.');
  const reservas = await Promise.all(
    Array.from({ length: 5 }, () => admin.rpc('projeto_email_reservar', args)),
  );
  if (reservas.map(exigir).filter((r) => r.resultado === 'reservada').length !== 1)
    throw new Error('Reserva duplicada.');
  const chave = reservas.map(exigir).find((r) => r.resultado === 'reservada').chave;
  exigir(
    await admin
      .from('projeto_portal_eventos')
      .update({ email_status: 'falhou', email_erro: 'envio_incerto' })
      .eq('id', id),
  );
  if (
    exigir(await admin.rpc('projeto_email_reservar', { ...args, p_fingerprint: 'b'.repeat(64) }))
      .resultado !== 'conteudo_alterado'
  )
    throw new Error('Mudança de payload insegura.');
  if (exigir(await admin.rpc('projeto_email_reservar', args)).chave !== chave)
    throw new Error('Chave mudou na recuperação.');
  // O webhook pode vencer a resposta da API. Um evento atrasado não regride o status.
  const confirmacao = {
    p_evento: id,
    p_fingerprint: args.p_fingerprint,
    p_provider_id: randomUUID(),
    p_status: 'entregue',
    p_ocorrido_em: new Date().toISOString(),
    p_tentativa: createHash('md5').update(chave).digest('hex'),
  };
  if (
    exigir(
      await admin.rpc('projeto_email_confirmar', {
        ...confirmacao,
        p_ocorrido_em: new Date(Date.now() - 24 * 3_600_000).toISOString(),
      }),
    )
  )
    throw new Error('Confirmação de uma tentativa anterior foi aceita.');
  if (!exigir(await admin.rpc('projeto_email_confirmar', confirmacao)))
    throw new Error('Webhook antecipado perdido.');
  exigir(await admin.rpc('projeto_email_confirmar', { ...confirmacao, p_status: 'enviado' }));
  if (
    exigir(await admin.from('projeto_portal_eventos').select('email_status').eq('id', id).single())
      .email_status !== 'entregue'
  )
    throw new Error('Status de entrega regrediu.');
  exigir(
    await admin
      .from('projeto_portal_eventos')
      .update({
        email_status: 'falhou',
        email_erro: 'envio_incerto',
        email_provider_id: null,
        email_primeira_tentativa_em: new Date(Date.now() - 24 * 3_600_000).toISOString(),
      })
      .eq('id', id),
  );
  if (
    exigir(await admin.rpc('projeto_email_reservar', args)).resultado !== 'verificacao_necessaria'
  )
    throw new Error('Tentativa fora da janela aceita.');
  exigir(
    await admin
      .from('projeto_portal_eventos')
      .update({ email_erro: 'envio_recusado' })
      .eq('id', id),
  );
  const nova = exigir(await admin.rpc('projeto_email_reservar', args));
  if (nova.resultado !== 'reservada' || nova.chave === chave)
    throw new Error('Recusa não permite nova tentativa.');
  if (
    exigir(
      await admin.rpc('projeto_email_confirmar', {
        ...confirmacao,
        p_ocorrido_em: new Date().toISOString(),
      }),
    )
  )
    throw new Error('Tentativa antiga substituiu a nova.');
  if (
    !exigir(
      await admin.rpc('projeto_email_confirmar', {
        ...confirmacao,
        p_provider_id: randomUUID(),
        p_tentativa: createHash('md5').update(nova.chave).digest('hex'),
        p_ocorrido_em: new Date().toISOString(),
      }),
    )
  )
    throw new Error('Nova tentativa não foi confirmada.');
  console.log(
    'Banco: concorrência, chave estável, prazo, permissão e webhook fora de ordem aprovados.',
  );
}

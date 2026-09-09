/** Teste opt-in: cria e apaga apenas contas/chamados de QA. Não envia e-mails. */
import { criarHarness, exigir, expect } from './qa-suporte-harness.mjs';
import { testarSuportePublico, testarIASuporte } from './qa-suporte-publico.mjs';
const h = await criarHarness();
try {
  const [cliente, intruso, equipe] = await Promise.all([
    h.conta('cliente'),
    h.conta('intruso'),
    h.conta('equipe', true),
  ]);
  const artigos = exigir(await h.anon.from('suporte_artigos').select('*'));
  expect(artigos.length).toBeGreaterThanOrEqual(12);
  expect((await h.anon.from('suporte_atendimentos').select('id')).error).not.toBeNull();
  const page = cliente.page;
  await page.goto(`${h.app}/suporte`);
  await expect(page.getByRole('heading', { name: 'Central de ajuda', exact: true })).toBeVisible();
  await h.visual(page, 'central');
  await page.getByRole('link', { name: 'Pedir ajuda', exact: true }).click();
  await page.getByLabel('O que você precisa resolver?').fill('QA: conexão da agenda');
  await page.getByLabel('Assunto', { exact: true }).selectOption('reunioes');
  await page
    .getByLabel('Descreva o que aconteceu')
    .fill('Estou testando o suporte. A agenda não voltou conectada.');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=',
    'base64',
  );
  await page
    .getByLabel('Escolher anexo')
    .setInputFiles({ name: 'print-qa.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('print-qa.png', { exact: true })).toBeVisible();
  const arquivos = exigir(
    await cliente.db.from('suporte_arquivos').select('id,caminho').eq('dono', cliente.user.id),
  );
  expect(arquivos.length).toBe(1);
  h.caminhos.push(arquivos[0].caminho);
  await page.getByRole('button', { name: 'Enviar pedido', exact: true }).click();
  await expect(page).toHaveURL(/\/suporte\/[a-f0-9-]{36}$/);
  const id = new URL(page.url()).pathname.split('/').at(-1);
  h.casos.push(id);
  await expect(
    page.getByText('Estou testando o suporte. A agenda não voltou conectada.', { exact: true }),
  ).toBeVisible();
  const repetido = exigir(
    await cliente.db.rpc('suporte_criar', {
      p_id: id,
      p_assunto: 'QA: conexão da agenda',
      p_categoria: 'reunioes',
      p_texto: 'Estou testando o suporte. A agenda não voltou conectada.',
      p_pagina: null,
      p_anexos: [arquivos[0].id],
    }),
  );
  expect(repetido).toBe(id);
  expect(exigir(await intruso.db.from('suporte_atendimentos').select('id').eq('id', id))).toEqual(
    [],
  );
  expect(
    exigir(await intruso.db.from('suporte_mensagens').select('texto').eq('atendimento', id)),
  ).toEqual([]);
  expect(
    exigir(await intruso.db.from('suporte_arquivos').select('id').eq('id', arquivos[0].id)),
  ).toEqual([]);
  expect(
    (
      await intruso.db.rpc('suporte_responder', {
        p_id: crypto.randomUUID(),
        p_atendimento: id,
        p_texto: 'Ataque negado',
        p_interna: false,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await cliente.db.rpc('suporte_responder', {
        p_id: crypto.randomUUID(),
        p_atendimento: id,
        p_texto: 'Nota negada',
        p_interna: true,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await intruso.db.rpc('suporte_atualizar', { p_id: id, p_status: 'resolvido' })).error,
  ).not.toBeNull();
  expect(
    (
      await cliente.db.from('suporte_mensagens').insert({
        atendimento: id,
        autor: cliente.user.id,
        papel: 'equipe',
        texto: 'Não permitido',
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await intruso.contexto.request.get(`${h.app}/api/suporte/anexos/${arquivos[0].id}`)).status(),
  ).toBe(404);
  const download = await cliente.contexto.request.get(
    `${h.app}/api/suporte/anexos/${arquivos[0].id}`,
  );
  expect(download.status()).toBe(200);
  expect(download.headers()['content-disposition']).toContain('attachment');
  console.log(
    'Segurança: isolamento entre contas, notas internas, anexos privados e criação idempotente OK.',
  );
  await equipe.page.goto(`${h.app}/suporte/equipe/${id}`);
  await equipe.page.getByRole('button', { name: 'Assumir atendimento', exact: true }).click();
  await expect(equipe.page.getByLabel('Responsável', { exact: true })).toHaveValue(equipe.user.id);
  await equipe.page
    .getByLabel('Sua mensagem', { exact: true })
    .fill('Confira a mesma conta escolhida no Google e tente novamente.');
  await equipe.page.getByRole('button', { name: 'Enviar mensagem', exact: true }).click();
  await expect(equipe.page.getByRole('status')).toContainText('Mensagem enviada.');
  await equipe.page
    .getByRole('checkbox', { name: 'Nota interna, visível apenas à equipe' })
    .check();
  await equipe.page
    .getByLabel('Nota interna', { exact: true })
    .fill('NOTA PRIVADA QA: visível apenas para a equipe.');
  await equipe.page.getByRole('button', { name: 'Salvar nota', exact: true }).click();
  await expect(equipe.page.getByRole('status')).toContainText('Nota interna salva.');
  await h.visual(equipe.page, 'atendimento-equipe');
  await page.reload();
  await expect(
    page.getByText('Confira a mesma conta escolhida no Google e tente novamente.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('NOTA PRIVADA QA: visível apenas para a equipe.', { exact: true }),
  ).toHaveCount(0);
  expect(
    exigir(
      await cliente.db
        .from('suporte_mensagens')
        .select('id')
        .eq('atendimento', id)
        .eq('interna', true),
    ),
  ).toEqual([]);
  await h.visual(page, 'atendimento-cliente');
  await page.getByRole('button', { name: 'Marcar como resolvido', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Reabrir atendimento', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Nota 5 de 5', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Obrigado pela avaliação.');
  await page.getByRole('button', { name: 'Reabrir atendimento', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Marcar como resolvido', exact: true }),
  ).toBeVisible();
  const caso = exigir(
    await cliente.db
      .from('suporte_atendimentos')
      .select('status,reaberturas,avaliacao,primeira_resposta_em')
      .eq('id', id)
      .single(),
  );
  expect(caso.status).toBe('em_atendimento');
  expect(caso.reaberturas).toBe(1);
  expect(caso.avaliacao).toBe(5);
  expect(caso.primeira_resposta_em).not.toBeNull();
  await equipe.page.goto(`${h.app}/suporte/equipe`);
  await equipe.page.getByLabel('Buscar por título ou número do atendimento').fill('QA: conexão');
  await equipe.page.getByLabel('Filtrar por responsável').selectOption('meus');
  await equipe.page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await expect(equipe.page.getByRole('link', { name: /QA: conexão da agenda/ })).toBeVisible();
  await equipe.page.getByLabel('Filtrar por responsável').selectOption('sem');
  await equipe.page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await expect(equipe.page.getByText('Nenhum atendimento com esses filtros.')).toBeVisible();
  await equipe.page.getByRole('link', { name: 'Limpar', exact: true }).click();
  await h.visual(equipe.page, 'fila');
  // Conversas longas mantêm o histórico inteiro sem carregar tudo de uma vez.
  exigir(
    await h.admin.from('suporte_mensagens').insert(
      Array.from({ length: 52 }, (_, i) => ({
        atendimento: id,
        papel: 'equipe',
        autor: equipe.user.id,
        texto: `Histórico QA ${i + 1}`,
        criado_em: new Date(Date.now() - (52 - i) * 1000).toISOString(),
      })),
    ),
  );
  await page.goto(`${h.app}/suporte/${id}`);
  await expect(page.getByRole('link', { name: 'Mensagens anteriores', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Mensagens anteriores', exact: true }).click();
  await expect(
    page.getByText('Estou testando o suporte. A agenda não voltou conectada.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Sua mensagem', { exact: true })).toHaveCount(0);
  expect(
    (
      await cliente.db.rpc('suporte_criar', {
        p_id: crypto.randomUUID(),
        p_assunto: 'Origem insegura',
        p_categoria: 'outros',
        p_texto: 'Este pedido deve ser rejeitado.',
        p_pagina: '//evil.test',
      })
    ).error,
  ).not.toBeNull();
  await page.goto(`${h.app}/ajuda/criar-proposta-sem-reuniao`);
  await h.visual(page, 'guia');
  console.log(
    'Jornada: abrir → atribuir → responder → nota privada → resolver → avaliar → reabrir OK.',
  );
  await testarSuportePublico(h, equipe);
  await testarIASuporte(h, cliente);
  console.log(`Evidências: ${h.pasta}`);
} finally {
  await h.limpar();
}

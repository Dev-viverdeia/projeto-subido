/** Usado somente pelo smoke opt-in, com projeto e conta descartáveis. */
/* global document, innerWidth */
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { expect as expectBase } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const expect = expectBase.configure({ timeout: 30_000 });

function exigir(resposta) {
  if (resposta.error) throw new Error(`QA aceite: ${resposta.error.code || 'operação recusada'}`);
  return resposta.data;
}

export async function validarAceiteCliente({
  app,
  admin,
  client,
  browser,
  page,
  usuario,
  empresa,
  oportunidade,
  entregaId,
  pasta,
  erros,
}) {
  exigir(
    await admin.from('calls_reunioes').insert({
      dono: usuario,
      empresa_id: empresa.id,
      oportunidade_id: oportunidade.id,
      titulo: 'Kickoff QA Aceite',
      tipo: 'kickoff',
      status: 'concluida',
      agendada_para: new Date().toISOString(),
      iniciada_em: new Date(Date.now() - 1_800_000).toISOString(),
      encerrada_em: new Date().toISOString(),
      duracao_minutos: 30,
      live_coach_ativo: false,
    }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${app}/entregas/${entregaId}`);
  await page.getByRole('link', { name: 'Completar acordo' }).click();
  await page
    .getByLabel('Objetivo combinado')
    .fill('Organizar a triagem da recepção com atendimento assistido por IA.');
  await page
    .getByLabel('Como saberemos que deu certo')
    .fill('A equipe recebe cada contato com o contexto validado nos testes.');
  await page.getByRole('button', { name: 'Próxima parte' }).click();
  await page.getByLabel('Responsável do cliente', { exact: true }).fill('Cliente QA');
  await page.getByLabel('Responsável pela implementação').fill('Implementador QA');
  await page.getByRole('button', { name: 'Próxima parte' }).click();
  await page
    .getByLabel('Acessos e permissões necessários')
    .fill('Permissão de leitura da agenda de testes');
  await page
    .getByLabel('Limites e fora de escopo')
    .fill('Sem orientações clínicas ou uso de dados reais');
  await page.getByRole('button', { name: 'Próxima parte' }).click();
  await page
    .getByLabel('Primeiros passos')
    .fill('Implementador revisa o material de teste com a recepção');
  await page.getByLabel('Observações internas').fill('NOTA_INTERNA_QA_NAO_PUBLICAR');
  const antesDoAceite = exigir(
    await client.from('projetos_execucao').select('briefing_kickoff').eq('id', entregaId).single(),
  );
  if (antesDoAceite.briefing_kickoff?.confirmadoEm)
    throw new Error('Avançar confirmou o acordo sem consentimento');
  await page.getByRole('button', { name: 'Confirmar acordo' }).click();
  await expect(page.getByRole('heading', { name: 'O combinado do projeto' })).toBeVisible();
  await page
    .getByLabel('Prazo da entrega')
    .fill(new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Salvar prazo' }).click();
  await expect(page.getByRole('button', { name: 'Abrir primeira tarefa' })).toBeVisible();
  const { portal_codigo: codigo } = exigir(
    await client.from('projetos_execucao').select('portal_codigo').eq('id', entregaId).single(),
  );
  await page.getByRole('button', { name: 'Abrir primeira tarefa' }).click();
  await expect(page.getByRole('heading', { name: 'Comprove e conclua' })).toBeVisible();
  console.log(
    'Kickoff: acordo e prazo confirmados pela UI; primeira tarefa abriu mesmo com dependências no plano.',
  );

  const contextoCliente = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: 'America/Sao_Paulo',
  });
  const portal = await contextoCliente.newPage();
  portal.setDefaultTimeout(30_000);
  portal.on('pageerror', (erro) => erros.push(`portal: ${erro.message}`));
  portal.on('console', (mensagem) => {
    if (
      mensagem.type() === 'error' &&
      /hydrat|Minified React error|server rendered HTML/i.test(mensagem.text())
    )
      erros.push(mensagem.text());
  });
  const portalUrl = `${app}/portal/${codigo}`;
  const tarefas = exigir(
    await client
      .from('projeto_tarefas')
      .select('id,titulo,fase_id')
      .eq('projeto_execucao_id', entregaId)
      .order('ordem'),
  );
  const email = `cliente-qa-${Date.now()}@example.invalid`;
  const caminhosQa = [];
  const arquivosQa = [];
  const captura = async (nome) => {
    if (!(await portal.evaluate(() => document.documentElement.scrollWidth <= innerWidth)))
      throw new Error('Portal com overflow');
    await portal.screenshot({ path: join(pasta, `${nome}.png`), fullPage: true });
  };
  try {
    for (const [nome, visivel, publicado] of [
      ['Material publicado QA', true, true],
      ['ARQUIVO_INTERNO_QA', false, false],
      ['ARQUIVO_SEM_PUBLICACAO_QA', true, false],
    ]) {
      const id = randomUUID();
      const caminho = `${usuario}/${entregaId}/${id}.txt`;
      const conteudo = 'Material sintético de QA. Nenhum dado de cliente.';
      exigir(
        await admin.storage
          .from('projeto-entregaveis')
          .upload(caminho, conteudo, { contentType: 'text/plain' }),
      );
      caminhosQa.push(caminho);
      exigir(
        await admin.from('projeto_arquivos').insert({
          id,
          dono: usuario,
          projeto_execucao_id: entregaId,
          tarefa_id: tarefas[0].id,
          grupo_id: randomUUID(),
          versao: 1,
          titulo: nome,
          nome_original: 'material-qa.txt',
          caminho_storage: caminho,
          mime_type: 'text/plain',
          tamanho_bytes: Buffer.byteLength(conteudo),
          visivel_cliente: visivel,
          publicado_em: publicado ? new Date().toISOString() : null,
        }),
      );
      arquivosQa.push({ id, nome, publicado });
    }
    for (const [indice, tarefa] of tarefas.entries()) {
      if (indice > 0) {
        await page.goto(`${app}/entregas/${entregaId}`);
      }
      await expect(page.locator('#tarefa-em-foco h2')).toHaveText(tarefa.titulo);
      const evidencia = page.getByLabel('Resultado e teste realizado');
      await evidencia.fill(
        `EVIDENCIA_INTERNA_QA_${indice}: configuração verificada com dados sintéticos e resultado registrado.`,
      );
      // Erro real de validação deve preservar o texto e permitir recuperação.
      await page.getByRole('button', { name: 'Concluir tarefa', exact: true }).click();
      await expect(
        page.getByRole('alert').filter({ hasText: 'Registro não confirmado' }),
      ).toContainText('Confirme');
      await expect(evidencia).toHaveValue(new RegExp(`EVIDENCIA_INTERNA_QA_${indice}`));
      await page.getByRole('checkbox', { name: /Revisei o resultado/ }).check();
      await page.getByRole('button', { name: 'Concluir tarefa', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Resultado registrado', exact: true }),
      ).toBeVisible();
      if (indice === 0) {
        await page
          .getByRole('button', { name: 'Ative o portal para enviar esta validação' })
          .click();
        await expect(page.locator('#portal-cliente')).toBeInViewport();
        await page.getByRole('button', { name: 'Ativar portal seguro' }).click();
        await expect(page.getByRole('link', { name: 'Abrir portal', exact: true })).toBeVisible();
        await portal.goto(portalUrl);
        await portal.getByRole('button', { name: 'Confirmar como resolvido' }).click();
        await expect(portal.getByRole('button', { name: 'Confirmar como resolvido' })).toHaveCount(
          0,
        );
        await page
          .getByRole('navigation', { name: 'Áreas da entrega' })
          .getByRole('button', { name: /^Trabalho/ })
          .click();
      }
      const final = indice === tarefas.length - 1;
      if (final) {
        const termo = page.locator('form').filter({ has: page.locator('textarea[name="resumo"]') });
        await expect(termo.locator('[name="resultado"]')).toHaveValue('');
        for (const [campo, valor] of Object.entries({
          resumo: 'Fluxo configurado e entregue com manual, testes e orientação à recepção.',
          resultado: 'Todos os cenários de teste combinados foram revisados pela equipe.',
          garantiaCobre: 'Correções no fluxo entregue e aprovado.',
          garantiaNaoCobre: 'Novos canais ou funcionalidades fora do escopo.',
          canalSuporte: 'suporte@example.invalid',
          responsavel: 'Cliente QA — recepção',
          continuidade: 'Acompanhar as transferências e registrar desvios no canal de suporte.',
        }))
          await termo.locator(`[name="${campo}"]`).fill(valor);
        await termo.getByRole('button', { name: 'Salvar encerramento' }).click();
        await expect(page.getByRole('button', { name: 'Solicitar aceite final' })).toBeEnabled();
      }
      const nota = page.getByLabel('Mensagem para o cliente');
      await nota.fill(`Entrega ${indice + 1} preparada: revise o material e o critério combinado.`);
      // Rascunho não depende de preencher o destinatário de um e-mail.
      if (indice === 0) {
        await page.getByRole('button', { name: 'Salvar mensagem' }).click();
        await expect(page.getByRole('status').filter({ hasText: /salv|preparad/i })).toBeVisible();
        await expect(nota).toHaveValue(
          'Entrega 1 preparada: revise o material e o critério combinado.',
        );
      }
      await page.getByLabel('E-mail que receberá a validação').fill(email);
      await page
        .getByRole('button', {
          name: final ? 'Solicitar aceite final' : 'Enviar para validação',
          exact: true,
        })
        .click();
      await expect(page.getByText('Agora é com o cliente.', { exact: true })).toBeVisible();
      await portal.goto(portalUrl);
      await expect(portal.getByRole('heading', { name: tarefa.titulo, exact: true })).toBeVisible();
      await expect(portal.locator('body')).not.toContainText('EVIDENCIA_INTERNA_QA');
      await expect(portal.locator('body')).not.toContainText('NOTA_INTERNA_QA');

      if (indice === 0) {
        await expect(
          portal
            .getByRole('list', { name: 'Arquivos desta entrega' })
            .getByRole('link', { name: 'Material publicado QA Versão 1' }),
        ).toBeVisible();
        await expect(portal.locator('body')).not.toContainText('ARQUIVO_INTERNO_QA');
        await expect(portal.locator('body')).not.toContainText('ARQUIVO_SEM_PUBLICACAO_QA');
        for (const arquivo of arquivosQa) {
          const resposta = await portal.request.get(`${portalUrl}/arquivos/${arquivo.id}`, {
            maxRedirects: 0,
          });
          if (resposta.status() !== (arquivo.publicado ? 307 : 404))
            throw new Error('Visibilidade do download incorreta');
          if (arquivo.publicado) {
            const download = await portal.request.get(resposta.headers().location);
            if (
              download.status() !== 200 ||
              !(await download.text()).includes('Material sintético')
            )
              throw new Error('Arquivo publicado indisponível');
          }
        }
        const cruzado = await portal.request.get(
          `${app}/portal/${randomUUID()}/arquivos/${arquivosQa[0].id}`,
          { maxRedirects: 0 },
        );
        if (cruzado.status() !== 404) throw new Error('Código inválido acessou arquivo');
        const heading = await portal
          .getByRole('heading', { name: 'Revise esta entrega.' })
          .boundingBox();
        if (!heading || heading.y > 500)
          throw new Error('Decisão muito distante do topo no celular');
        await captura('cliente-mobile-revisao');
        const axe = await new AxeBuilder({ page: portal }).analyze();
        const graves = axe.violations.filter((item) =>
          ['serious', 'critical'].includes(item.impact),
        );
        if (graves.length)
          throw new Error(`Acessibilidade portal: ${graves.map((item) => item.id).join(', ')}`);
        await portal.getByRole('button', { name: 'Pedir ajuste' }).click();
        await portal
          .getByLabel('O que precisa mudar?')
          .fill('Inclua o caminho de transferência para a recepção no material.');
        await portal.getByRole('button', { name: 'Enviar ajuste' }).click();
        await expect(
          portal.getByRole('heading', { name: 'Seu pedido de ajuste foi recebido.' }),
        ).toBeVisible();
        await captura('cliente-mobile-ajuste-recebido');
        await page.reload();
        await expect(page.locator('#tarefa-em-foco blockquote')).toContainText(
          'Inclua o caminho de transferência para a recepção no material.',
        );
        await expect(page.getByLabel('Como você testou o ajuste?')).toBeVisible();
        await page.screenshot({ path: join(pasta, 'profissional-ajuste.png'), fullPage: true });
        await page
          .getByLabel('Como você testou o ajuste?')
          .fill('EVIDENCIA_INTERNA_QA_AJUSTE: transferência incluída e retestada com a recepção.');
        await page.getByRole('checkbox', { name: /Revisei o resultado/ }).check();
        await page.getByRole('button', { name: 'Concluir ajuste', exact: true }).click();
        await page
          .getByLabel('Mensagem para o cliente')
          .fill('Material revisado com o caminho de transferência solicitado.');
        await page.getByRole('button', { name: 'Enviar para validação', exact: true }).click();
        await expect(page.getByText('Agora é com o cliente.', { exact: true })).toBeVisible();
        await portal.reload();
        await expect(
          portal
            .getByRole('region', { name: 'Revise esta entrega.' })
            .getByText('Material revisado com o caminho de transferência solicitado.', {
              exact: true,
            }),
        ).toBeVisible();
      }
      if (final) {
        await expect(portal.getByText('30 dias a partir do aceite final')).toBeVisible();
        await expect(portal.getByText('executado', { exact: true })).toBeVisible();
        await captura('cliente-mobile-aceite-final');
      }
      await portal
        .getByRole('button', {
          name: final ? 'Aprovar e concluir' : 'Aprovar entrega',
          exact: true,
        })
        .click();
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
        .toBe('aprovada');
      console.log(
        `Entrega ${indice + 1}/${tarefas.length}: ${indice === 0 ? 'ajuste, reteste, reenvio e ' : ''}aprovação registrada.`,
      );
    }
    await expect(portal.getByRole('heading', { name: 'Projeto concluído.' })).toBeVisible();
    await captura('cliente-mobile-concluido');
    await portal.setViewportSize({ width: 1440, height: 1000 });
    await captura('cliente-desktop-concluido');
    const encerramento = exigir(
      await client
        .from('projeto_encerramentos')
        .select('status,aceito_em,garantia_termina_em')
        .eq('projeto_execucao_id', entregaId)
        .single(),
    );
    if (
      encerramento.status !== 'encerrado' ||
      !encerramento.aceito_em ||
      !encerramento.garantia_termina_em
    )
      throw new Error('Aceite não encerrou atomicamente');
    await page.goto(`${app}/entregas/${entregaId}`);
    await expect(page.getByRole('button', { name: /Evolução/ })).toBeVisible();
    await page.screenshot({ path: join(pasta, 'profissional-concluido.png') });
    await page
      .getByRole('navigation', { name: 'Áreas da entrega' })
      .getByRole('button', { name: /^Cliente/ })
      .click();
    await page.getByRole('button', { name: 'Pausar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Ativar portal seguro' })).toBeVisible();
    const revogado = await portal.goto(portalUrl);
    if (revogado.status() !== 404) throw new Error('Portal pausado ainda acessível');
    const arquivoRevogado = await portal.request.get(`${portalUrl}/arquivos/${arquivosQa[0].id}`, {
      maxRedirects: 0,
    });
    if (arquivoRevogado.status() !== 404) throw new Error('Portal pausado gerou novo download');
    console.log(
      'Aceite final encerrou projeto e iniciou garantia; portal pausado respondeu 404. Notificações usam apenas example.invalid; entrega de e-mail não validada.',
    );
  } catch (erro) {
    await portal
      .screenshot({ path: join(pasta, 'falha-cliente.png'), fullPage: true })
      .catch(() => {});
    throw erro;
  } finally {
    await contextoCliente.close();
    if (caminhosQa.length)
      exigir(await admin.storage.from('projeto-entregaveis').remove(caminhosQa));
  }
}

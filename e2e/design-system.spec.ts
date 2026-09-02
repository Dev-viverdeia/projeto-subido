import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CST } from '../src/lib/brand';

const TELAS = [
  ['/', 'As empresas já'],
  ['/entrar', 'Entrar'],
  ['/preview/boas-vindas', 'Conheça o caminho até seu primeiro projeto de IA.'],
  ['/preview/mapa-jornada', 'Defina a próxima ação'],
  ['/preview/crm', 'Acompanhe cada venda de projeto de IA e saiba o que fazer em seguida.'],
  ['/preview/metricas', 'Veja o funil e o próximo ponto de atenção.'],
  ['/preview/prospeccao', 'Encontre empresas por segmento e região.'],
  ['/preview/calls', 'Início do projeto'],
  ['/preview/call-preparo', 'Confirmar se a perda de contatos'],
  ['/preview/sala-call', 'Descoberta do atendimento da Clínica Rios'],
  ['/preview/live-coach', 'Dimensione o custo da espera'],
  ['/preview/crm-dossie', 'Clínica Aurora'],
  ['/preview/pos-call', 'Descoberta do atendimento da Clínica Horizonte'],
  ['/preview/propostas', 'Biblioteca comercial'],
  ['/preview/admin-acessos', 'Acessos e créditos'],
  ['/preview/proposta-editor', 'Proposta pronta para decisão'],
  ['/preview/entregas', 'Acompanhe a próxima tarefa de cada projeto.'],
  ['/preview/sala-entrega', 'Atendimento com IA para clínicas'],
  ['/preview/portal-cliente', 'Projeto entregue e aprovado.'],
  ['/preview/mentorias', 'Leve um caso. Saia com direção.'],
  ['/preview/certificados', 'Comprove o que você concluiu.'],
  ['/preview/certificado', 'ChatGPT para o trabalho'],
  ['/preview/formacoes', 'Aprenda. Aplique no trabalho.'],
  ['/preview/formacao', 'ChatGPT para o trabalho'],
  ['/preview/aula', 'Como conversar com a IA para obter respostas úteis'],
  ['/preview/estudio', 'Adapte um projeto ao cliente.'],
  ['/preview/estudio-entrevista', 'Personalize o plano'],
  ['/preview/estudio-sala', 'Atendimento e qualificação com IA'],
] as const;

test.describe('fundação visual Viver de IA', () => {
  for (const [rota, titulo] of TELAS) {
    test(`${rota} usa a base oficial sem estouro horizontal`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByText(titulo, { exact: false }).first()).toBeVisible();

      const estado = await page.evaluate(() => {
        const estilo = getComputedStyle(document.documentElement);
        return {
          navy: estilo.getPropertyValue('--via-navy').trim().toUpperCase(),
          fonte: estilo.getPropertyValue('--via-font').trim(),
          largura: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
        };
      });

      expect(estado.navy).toBe(CST.navy.toUpperCase());
      expect(estado.fonte.toLowerCase()).toContain('geist');
      expect(estado.fonte.toLowerCase()).not.toContain('outfit');
      expect(estado.largura).toBeLessThanOrEqual(estado.viewport + 1);
    });
  }

  test('o lockup oficial identifica a entrada', async ({ page }) => {
    await page.goto('/entrar');
    await expect(page.getByRole('img', { name: 'Subido' })).toBeVisible();
  });

  test('a Início não repete o método nem o consultor', async ({ page }) => {
    await page.goto('/preview/mapa-jornada');

    await expect(page.getByRole('list', { name: 'Seu caminho na plataforma' })).toHaveCount(0);
    await expect(page.getByText('Como usar a plataforma', { exact: true })).toHaveCount(0);
    await expect(page.locator('#sobral-ai')).toHaveCount(0);
    await expect(page.getByText('Meta da etapa · Segundo ciclo comprovado')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Confirmar o segundo projeto' })).toHaveCount(0);
  });

  test('a Início mostra uma única ação e mantém o contexto essencial acessível', async ({
    page,
  }) => {
    await page.goto('/preview/mapa-jornada');

    const comando = page.getByRole('region', { name: 'Próxima ação' });
    await expect(comando).toBeVisible();
    await expect(comando.getByRole('heading', { name: 'Defina a próxima ação' })).toBeVisible();
    await expect(comando.getByRole('link', { name: 'Definir próxima ação' })).toBeVisible();
    await expect(comando.getByRole('progressbar', { name: 'Progresso do trabalho' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ver agenda/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'O que já está na sua mesa.' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Continue de onde parou.' })).toHaveCount(0);
    await expect(page.getByText('Seu mercado', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Projeto principal', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Como vende', { exact: true })).toHaveCount(0);

    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });

  test('o Estúdio conduz do briefing ao plano sem prometer executar o serviço', async ({
    page,
  }) => {
    await page.goto('/preview/estudio');

    await expect(
      page.getByRole('heading', { name: 'Adapte um projeto ao cliente.' }),
    ).toBeVisible();
    await expect(page.getByRole('combobox', { name: /Projeto-base/ })).toHaveValue(
      '11111111-1111-4111-8111-111111111111',
    );
    await expect(page.getByRole('combobox', { name: /Cliente em negociação/ })).toHaveValue(
      '22222222-2222-4222-8222-222222222222',
    );

    const preparar = page.getByRole('button', { name: 'Preparar entrevista' });
    await expect(preparar).toBeDisabled();
    await page
      .getByRole('textbox', { name: 'O problema do cliente e o que você já sabe' })
      .fill('O cliente precisa reduzir o tempo de resposta e organizar a qualificação.');
    await expect(preparar).toBeEnabled();
    await expect(page.getByText('Um projeto pronto para trabalhar.')).toHaveCount(0);
  });

  for (const rota of ['/preview/estudio', '/preview/estudio-entrevista', '/preview/estudio-sala']) {
    test(`${rota} não tem violações graves de acessibilidade`, async ({ page }) => {
      await page.goto(rota);
      const resultado = await new AxeBuilder({ page }).analyze();
      const graves = resultado.violations.filter(
        (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
      );
      expect(graves).toEqual([]);
    });
  }

  for (const rota of [
    '/preview/calls',
    '/preview/call-preparo',
    '/preview/sala-call',
    '/preview/live-coach',
    '/preview/pos-call',
  ]) {
    test(`${rota} mantém a jornada de reunião acessível`, async ({ page }) => {
      await page.goto(rota);
      const resultado = await new AxeBuilder({ page }).analyze();
      const graves = resultado.violations.filter(
        (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
      );
      expect(graves).toEqual([]);
    });
  }

  test('a Sala mantém todo o plano alcançável na rolagem', async ({ page }) => {
    await page.goto('/preview/sala-entrega');

    await expect(page.getByRole('button', { name: /Evolução/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { name: 'Revisão de resultado' })).toBeVisible();
    await expect(page.getByText('Registre o que o cliente confirmou.')).toBeVisible();

    await page.getByRole('button', { name: /Trabalho/ }).click();
    const fimDaSala = page.getByRole('button', { name: 'Ver acordo e portal' });
    await fimDaSala.scrollIntoViewIfNeeded();
    await expect(fimDaSala).toBeVisible();

    const alturas = await page.evaluate(() => ({
      documento: document.documentElement.scrollHeight,
      corpo: document.body.scrollHeight,
    }));
    expect(Math.abs(alturas.documento - alturas.corpo)).toBeLessThanOrEqual(2);
  });

  test('Entregas traz a revisão vencida para a frente sem criar outro módulo', async ({ page }) => {
    await page.goto('/preview/entregas');

    await expect(
      page.getByRole('heading', { name: '1 revisão pede atenção agora.' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir revisão de Nexo Imóveis' })).toBeVisible();
    await expect(page.getByText('Registrar resultado')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Entregas concluídas' })).toBeVisible();
  });

  test('o portal mantém o encerramento acessível depois do aceite final', async ({ page }) => {
    await page.goto('/preview/portal-cliente');
    await page.getByText('Resultado e continuidade', { exact: true }).click();

    const encerramento = page.getByRole('heading', {
      name: 'Resultado, garantia e continuidade.',
    });
    await encerramento.scrollIntoViewIfNeeded();
    await expect(encerramento).toBeVisible();

    const revisao = page.getByRole('heading', { name: 'Vamos revisar o resultado.' });
    await revisao.scrollIntoViewIfNeeded();
    await expect(revisao).toBeVisible();
    await expect(page.getByText('Até 09 de setembro de 2026')).toBeVisible();
    await expect(page.getByText('suporte@mateussilva.com.br')).toBeVisible();
  });

  test('o pós-call preserva áudio e transcrição como fontes privadas', async ({ page }) => {
    await page.goto('/preview/pos-call');
    await page.getByText('Análise completa', { exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Gravação privada da reunião' })).toBeVisible();
    await expect(page.getByText('Somente sua conta')).toBeVisible();
    await expect(page.getByText('Transcrição da reunião')).toBeVisible();
  });

  test('uma reunião vencida abre uma decisão inteira dentro da tela', async ({ page }) => {
    await page.goto('/preview/calls');
    await page.getByRole('button', { name: 'Resolver pendência' }).first().click();

    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByRole('heading', { name: 'Resolver reunião pendente' })).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Escolher novo horário' })).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Marcar como não realizada' })).toBeVisible();

    const caixa = await dialogo.boundingBox();
    const viewport = page.viewportSize();
    expect(caixa).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(caixa!.x).toBeGreaterThanOrEqual(0);
    expect(caixa!.y).toBeGreaterThanOrEqual(0);
    expect(caixa!.x + caixa!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(viewport!.height + 1);
  });

  test('as reuniões mantêm as ações secundárias acessíveis sem poluir a agenda', async ({
    page,
  }) => {
    await page.goto('/preview/calls');

    await expect(page.getByText('Início do projeto', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Outras ações' }).first().click();
    await expect(page.getByRole('menuitem', { name: 'Copiar link da sala' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Entrar na sala' })).toBeVisible();
  });

  test('o kickoff conecta a reunião ao início do projeto sem perder contexto', async ({ page }) => {
    await page.goto('/preview/call-preparo?tipo=kickoff');

    await expect(page.getByRole('heading', { name: 'Acordos essenciais' })).toBeVisible();
    await expect(page.getByLabel('Continuidade do kickoff')).toContainText(
      'As decisões confirmadas viram o acordo do projeto.',
    );
    await expect(page.getByText('SDR de atendimento para Clínica Horizonte')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir projeto' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar no kickoff' })).toBeVisible();

    const temOverflowHorizontal = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(temOverflowHorizontal).toBe(false);
  });

  test('o agendamento do kickoff permanece inteiro e rolável em qualquer tela', async ({
    page,
  }) => {
    await page.goto(
      '/preview/calls?calendar=1&modal=1&oportunidade=22222222-2222-4222-8222-222222222222&tipo=kickoff',
    );

    const dialogo = page.getByRole('dialog', { name: 'Agendar kickoff' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByText('Projeto vinculado')).toBeVisible();
    await expect(dialogo.getByLabel('Resultado esperado do kickoff')).toBeVisible();

    const coach = dialogo.getByText('Live Coach', { exact: true });
    await coach.scrollIntoViewIfNeeded();
    await expect(coach).toBeVisible();
    await expect(
      dialogo.getByRole('button', { name: 'Agendar kickoff e enviar convite' }),
    ).toBeVisible();

    const temOverflowHorizontal = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(temOverflowHorizontal).toBe(false);
  });

  test('a biblioteca comercial filtra propostas dentro de uma única superfície', async ({
    page,
  }) => {
    await page.goto('/preview/propostas');

    const arquivo = page.getByRole('region', { name: 'Suas propostas' });
    await expect(arquivo).toBeVisible();
    await page.getByRole('tab', { name: /Rascunhos/ }).click();
    await expect(arquivo.getByText('Rascunho', { exact: true }).first()).toBeVisible();
    await page.getByRole('tab', { name: /Enviadas/ }).click();
    await expect(arquivo.getByText('Enviada', { exact: true }).first()).toBeVisible();
  });

  test('o pós-call em processamento mostra avanço sem expor um resumo vazio', async ({ page }) => {
    await page.goto('/preview/pos-call?estado=processando');

    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Salvando a conversa' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gravação privada da reunião' })).toHaveCount(0);
  });

  test('o kickoff conduz da sala ao acordo do projeto', async ({ page }) => {
    await page.goto('/preview/sala-call?tipo=kickoff');
    await expect(page.getByRole('heading', { name: 'Preparar kickoff' })).toBeVisible();
    await expect(page.getByText('Resultado e sucesso')).toBeVisible();
    await expect(page.getByText('Responsáveis e acessos')).toBeVisible();
    await expect(page.getByText('Revise o acordo antes de iniciar a execução.')).toBeVisible();

    await page.goto('/preview/live-coach?tipo=kickoff');
    await expect(
      page.getByRole('complementary', { name: 'Acordo do projeto privado' }),
    ).toBeVisible();
    await expect(page.getByText('Próximo ponto a confirmar')).toBeVisible();
    await expect(page.getByText('Acordo pronto para revisão ao encerrar')).toBeAttached();

    await page.goto('/preview/pos-call?tipo=kickoff');
    await expect(page.getByRole('heading', { name: 'O que ficou combinado' })).toBeVisible();
    await expect(page.getByText('Próximo marco do projeto')).toBeVisible();
    await expect(page.getByRole('link', { name: /Revisar o briefing/ })).toHaveAttribute(
      'href',
      '/entregas/projeto-preview#briefing-kickoff',
    );
  });

  test('a preparação do kickoff permanece inteira no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/preview/sala-call?tipo=kickoff');

    await expect(page.getByRole('heading', { name: 'Preparar kickoff' })).toBeVisible();
    const medidas = await page.evaluate(() => ({
      largura: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(medidas.largura).toBeLessThanOrEqual(medidas.viewport + 1);

    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(graves).toEqual([]);
  });

  test('Mentorias explica o custo antes de confirmar o check-in', async ({ page }) => {
    await page.goto('/preview/mentorias');

    await page
      .getByRole('button', { name: /Fazer check-in · 1 crédito/ })
      .first()
      .click();
    const dialogo = page.getByRole('dialog', { name: 'Confirmar check-in' });
    await expect(dialogo).toContainText('Saldo atual');
    await expect(dialogo).toContainText('Saldo depois');
    await expect(dialogo.getByRole('button', { name: 'Usar 1 crédito e confirmar' })).toBeVisible();
  });

  test('Mentorias mantém a agenda limpa e acessível', async ({ page }) => {
    await page.goto('/preview/mentorias');

    await expect(
      page.getByRole('heading', { name: 'Leve um caso. Saia com direção.' }),
    ).toBeVisible();
    await expect(page.getByText('Saldo disponível', { exact: true })).toHaveCount(0);

    const resultado = await new AxeBuilder({ page }).analyze();
    const violacoesGraves = resultado.violations.filter(
      (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
    );
    expect(violacoesGraves).toEqual([]);
  });

  test('Certificados prioriza a prova pública e o compartilhamento', async ({ page }) => {
    await page.goto('/preview/certificados');
    await expect(page.getByRole('heading', { name: 'Conquistados' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver certificado' })).toBeVisible();

    await page.goto('/preview/certificado');
    await expect(page.getByRole('link', { name: 'Compartilhar no LinkedIn' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copiar link' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar em PDF' })).toBeVisible();
  });

  test('Formações leva da retomada à aula sem repetir a explicação do produto', async ({
    page,
  }) => {
    await page.goto('/preview/formacoes');

    await expect(
      page.getByRole('heading', { name: 'Aprenda. Aplique no trabalho.' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Começar formação/ }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Todas as formações' })).toBeVisible();
    await expect(page.getByText('Uma ordem clara para evoluir.')).toHaveCount(0);
    await expect(page.getByText('Como usar Formações e Projetos')).toHaveCount(0);

    await page.goto('/preview/formacao');
    await expect(page.getByRole('region', { name: 'Seu progresso' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Começar formação' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Aulas da formação' })).toBeVisible();

    await page.goto('/preview/aula');
    await expect(page.getByText('Vídeo em produção')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Concluir e avançar' })).toBeVisible();
    if ((page.viewportSize()?.width ?? 0) < 1080) {
      await expect(page.getByRole('button', { name: 'Ver as aulas do curso' })).toBeVisible();
    } else {
      await expect(page.getByText('Conteúdo da formação', { exact: true })).toBeVisible();
    }
  });
});

import { expect, test } from '@playwright/test';
import { CST } from '../src/lib/brand';

const TELAS = [
  ['/', 'As empresas já'],
  ['/entrar', 'Entrar'],
  ['/preview/boas-vindas', 'Conheça o caminho até seu primeiro projeto de IA.'],
  ['/preview/mapa-jornada', 'Mateus,'],
  ['/preview/crm', 'Acompanhe cada venda de projeto de IA e saiba o que fazer em seguida.'],
  ['/preview/metricas', 'Veja o funil e o próximo ponto de atenção.'],
  ['/preview/prospeccao', 'Encontre empresas por segmento e região.'],
  ['/preview/calls', 'O que fica salvo'],
  ['/preview/sala-call', 'Descoberta do atendimento da Clínica Rios'],
  ['/preview/live-coach', 'Dimensione o custo da espera'],
  ['/preview/crm-dossie', 'Clínica Aurora'],
  ['/preview/pos-call', 'Descoberta do atendimento da Clínica Horizonte'],
  ['/preview/propostas', 'Biblioteca comercial'],
  ['/preview/proposta-editor', 'Proposta pronta para decisão'],
  ['/preview/entregas', 'Execute o próximo passo de cada cliente.'],
  ['/preview/sala-entrega', 'Atendimento com IA para clínicas'],
  ['/preview/portal-cliente', 'Projeto entregue e aprovado.'],
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

  test('a Início preserva contraste e leva direto às áreas de trabalho', async ({ page }) => {
    await page.goto('/preview/mapa-jornada');

    await expect(page.getByRole('heading', { name: 'bem-vindo.' })).toHaveCSS(
      'color',
      'rgb(255, 255, 255)',
    );
    const abertura = page.getByLabel('Resumo do dia');
    await expect(abertura).toBeVisible();
    await expect(page.getByRole('heading', { name: 'O que já está na sua mesa.' })).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Aprenda e prepare o que você vai entregar.' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Continue de onde parou.' })).toHaveCount(0);
    await expect(page.getByText('Seu mercado', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Projeto principal', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Como vende', { exact: true })).toHaveCount(0);
  });

  test('a Sala mantém todo o plano alcançável na rolagem', async ({ page }) => {
    await page.goto('/preview/sala-entrega');

    await expect(page.getByRole('button', { name: /Evolução/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { name: 'Revisão de resultado' })).toBeVisible();
    await expect(page.getByText('Registre o que o cliente confirmou.')).toBeVisible();

    await page.getByRole('button', { name: /Executar/ }).click();
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

  test('o pós-call em processamento mostra avanço sem expor um resumo vazio', async ({ page }) => {
    await page.goto('/preview/pos-call?estado=processando');

    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Salvando a conversa' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gravação privada da reunião' })).toHaveCount(0);
  });
});

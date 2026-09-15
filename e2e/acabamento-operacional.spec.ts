import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('entrada e cadastro mantêm campos legíveis no celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const rota of ['/entrar', '/criar-conta', '/recuperar-senha']) {
    await page.goto(rota);
    const campos = page.locator('main input:not([type="hidden"])');
    expect(await campos.count()).toBeGreaterThan(0);
    for (const campo of await campos.all()) {
      expect(
        await campo.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(16);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      391,
    );
  }
});

test('Escape recolhe a lista antes de fechar o formulário', async ({ page }) => {
  await page.goto('/preview/shell?tela=controles');
  const abrir = page.getByRole('button', { name: 'Editar dados', exact: true });
  await abrir.click();
  const dialogo = page.getByRole('dialog', { name: 'Editar dados', exact: true });
  const empresa = dialogo.getByRole('textbox', { name: 'Empresa', exact: true });
  const etapa = dialogo.getByRole('button', { name: 'Etapa', exact: true });
  await empresa.fill('Clínica Horizonte');
  await etapa.click();
  await expect(etapa).toHaveAttribute('aria-expanded', 'true');
  await etapa.press('Escape');
  await expect(etapa).toHaveAttribute('aria-expanded', 'false');
  await expect(etapa).toBeFocused();
  await expect(empresa).toHaveValue('Clínica Horizonte');
  await expect(page.locator('[data-app-shell]')).toHaveAttribute('inert');

  await etapa.press('Escape');
  await expect(dialogo).toHaveCount(0);
  await expect(abrir).toBeFocused();
  await expect(page.locator('[data-app-shell]')).not.toHaveAttribute('inert');
  expect(await page.locator('body').evaluate((el) => el.style.overflow)).toBe('');
});

test('Tab circula no formulário e mantém o foco visível', async ({ page, browserName }) => {
  await page.goto('/preview/shell?tela=controles');
  await page.getByRole('button', { name: 'Editar dados', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Editar dados', exact: true });
  const fechar = dialogo.getByRole('button', { name: 'Fechar diálogo' });
  const salvar = dialogo.getByRole('button', { name: 'Salvar alterações' });
  await expect(fechar).toBeFocused();
  await fechar.press('Shift+Tab');
  await expect(salvar).toBeFocused();
  await salvar.press('Tab');
  await expect(fechar).toBeFocused();
  expect(await fechar.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
  await expect(fechar).not.toHaveCSS('box-shadow', 'none');
  await fechar.press('Tab');
  if (browserName === 'firefox') {
    // O Firefox inclui regiões roláveis na ordem nativa do teclado. Preserva
    // esse acesso e verifica que o foco continua visível e dentro do modal.
    const corpo = dialogo.locator('.via-modal__body');
    await expect(corpo).toBeFocused();
    expect(await corpo.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
    expect(
      await corpo.evaluate((el) => {
        const estilo = getComputedStyle(el);
        return (
          (estilo.outlineStyle !== 'none' && parseFloat(estilo.outlineWidth) > 0) ||
          estilo.boxShadow !== 'none'
        );
      }),
    ).toBe(true);
    await corpo.press('Tab');
  }
  await expect(dialogo.getByRole('textbox', { name: 'Empresa', exact: true })).toBeFocused();
});

test('tela curta preserva cabeçalho e rodapé com rolagem só no corpo', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/preview/shell?tela=controles');
  await page.getByRole('button', { name: 'Editar dados', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Editar dados', exact: true });
  // Espera a entrada real terminar; não mede um quadro intermediário.
  await dialogo.evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((animation) => animation.finished));
  });
  await expect(dialogo.getByRole('heading', { name: 'Editar dados' })).toBeInViewport({ ratio: 1 });
  await expect(dialogo.getByRole('button', { name: 'Salvar alterações' })).toBeInViewport({
    ratio: 1,
  });
  const corpo = dialogo.locator('.via-modal__body');
  const medidas = await corpo.evaluate((el) => ({
    visivel: el.clientHeight,
    conteudo: el.scrollHeight,
    overflow: getComputedStyle(el).overflowY,
    pagina: document.documentElement.scrollWidth,
    largura: window.innerWidth,
  }));
  expect(medidas.conteudo).toBeGreaterThan(medidas.visivel);
  expect(medidas.overflow).toBe('auto');
  expect(medidas.pagina).toBeLessThanOrEqual(medidas.largura + 1);
});

test('movimento reduzido mantém modal e fundo no estado final', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/shell?tela=controles');
  await page.getByRole('button', { name: 'Editar dados', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCSS('animation-name', 'none');
  await expect(page.getByRole('dialog')).toHaveCSS('transform', 'none');
  await expect(page.locator('.via-modal-scrim')).toHaveCSS('animation-name', 'none');
  await expect(
    page.getByRole('dialog').getByRole('textbox', { name: 'Empresa', exact: true }),
  ).toBeVisible();
});

test('a consequência do convite fica inteira no botão em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(
    '/preview/calls?calendar=1&modal=1&oportunidade=22222222-2222-4222-8222-222222222222&tipo=kickoff',
  );
  const dialogo = page.getByRole('dialog', { name: 'Agendar kickoff', exact: true });
  const enviar = dialogo.getByRole('button', { name: 'Agendar kickoff e enviar convite' });
  await expect(enviar).toBeInViewport({ ratio: 1 });
  const texto = await enviar.evaluate((el) => {
    const rotulo = el.querySelector('.via-btn__label')!;
    return {
      largura: rotulo.clientWidth,
      conteudo: rotulo.scrollWidth,
      caixa: el.clientWidth,
      conteudoBotao: el.scrollWidth,
    };
  });
  expect(texto.conteudo).toBeLessThanOrEqual(texto.largura + 1);
  expect(texto.conteudoBotao).toBeLessThanOrEqual(texto.caixa + 1);
  await expect(dialogo).toHaveAccessibleDescription(
    'Defina o horário. O convite abre a sala e liga o kickoff ao projeto deste cliente.',
  );
});

test('projeto troca de área pelo teclado sem deslocar o cabeçalho', async ({ page }) => {
  await page.goto('/preview/projeto');
  const titulo = page.getByRole('heading', { name: 'Atendimento no WhatsApp com IA', exact: true });
  await expect(titulo).toBeVisible();
  const abas = page.getByRole('tablist', { name: 'Áreas do projeto' });
  const antes = await abas.boundingBox();
  await abas.getByRole('tab', { name: 'Visão geral', exact: true }).press('ArrowRight');
  await expect(abas.getByRole('tab', { name: 'Aprender', exact: true })).toBeFocused();
  await abas.getByRole('tab', { name: 'Aprender', exact: true }).press('ArrowRight');
  await expect(abas.getByRole('tab', { name: 'Implementar', exact: true })).toBeFocused();
  const depois = await abas.boundingBox();
  expect(Math.abs(depois!.y - antes!.y)).toBeLessThanOrEqual(1);
  await expect(abas.locator('[tabindex="0"]')).toHaveCount(1);
  await expect(page.getByRole('tabpanel', { name: 'Implementar', exact: true })).toBeVisible();
});

for (const rota of ['/preview/projeto', '/preview/suporte?tela=cliente']) {
  test(`${rota} mantém leitura e controles sem violações graves detectadas`, async ({ page }) => {
    await page.goto(rota);
    const resultado = await new AxeBuilder({ page }).analyze();
    expect(
      resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  });
}

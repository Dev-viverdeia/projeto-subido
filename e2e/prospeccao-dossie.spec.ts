import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Estação de Prospecção', () => {
  test('abre os canais e mantém o envio a Vendas como uma ação explícita', async ({ page }) => {
    await page.goto('/preview/prospeccao');
    const empresa = page.getByRole('button', { name: 'Ver detalhes' }).first();

    await empresa.click();
    const dialogo = page.getByRole('dialog', { name: 'Clínica Aurora' });
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole('heading', { name: 'Contatos da empresa' })).toBeVisible();
    await expect(dialogo.getByRole('link', { name: 'WhatsApp' }).first()).toBeVisible();
    await expect(dialogo.getByRole('link', { name: 'Escrever' })).toBeVisible();
    await expect(dialogo.getByText('@clinicaaurora', { exact: true }).first()).toBeVisible();
    await expect(
      dialogo.getByText('Crie uma oportunidade para trabalhar esta empresa.'),
    ).toBeVisible();
    await expect(dialogo.getByRole('button', { name: 'Criar oportunidade' })).toBeVisible();

    const decisores = dialogo.getByText('Possíveis decisores');
    await decisores.scrollIntoViewIfNeeded();
    await expect(decisores).toBeVisible();
    await expect(dialogo.getByText('Ana Aurora')).toBeHidden();
    await decisores.click();
    await expect(dialogo.getByText('Ana Aurora')).toBeVisible();

    const estourou = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(estourou).toBe(false);

    const areasDeRolagem = await dialogo.evaluate((elemento) =>
      [elemento, ...elemento.querySelectorAll<HTMLElement>('*')].some((item) => {
        const overflow = getComputedStyle(item).overflowY;
        return (
          item !== elemento.children[1] &&
          (overflow === 'auto' || overflow === 'scroll') &&
          item.scrollHeight > item.clientHeight + 2
        );
      }),
    );
    expect(areasDeRolagem).toBe(false);
    await expect(dialogo.getByRole('button', { name: 'Criar oportunidade' })).toBeInViewport();

    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
    await expect(empresa).toBeFocused();
  });

  test('mostra contatos únicos, fontes honestas e alternativas sob demanda', async ({ page }) => {
    await page.goto('/preview/prospeccao?contatos=1');
    await page.getByRole('button', { name: 'Ver detalhes' }).first().click();
    const dialogo = page.getByRole('dialog');
    const principais = dialogo.getByRole('list', { name: 'Contatos principais' });
    await expect(principais.getByRole('listitem')).toHaveCount(3);
    await expect(principais.getByText('(31) 3333-4444', { exact: true })).toHaveCount(1);
    await expect(principais.getByText('Google Maps', { exact: true })).toBeVisible();
    await expect(principais.getByText('Site da empresa', { exact: true })).toBeVisible();
    await expect(principais.getByText('Fonte não informada', { exact: true })).toBeVisible();
    await expect(dialogo.getByText('529.982.247-25', { exact: true })).toHaveCount(0);
    await expect(dialogo.getByText('(18) 4789-4818', { exact: true })).toHaveCount(0);
    await expect(
      dialogo.getByText('Telefones de uma coleta antiga foram ocultados.', { exact: false }),
    ).toBeVisible();
    const extras = dialogo.getByRole('list', { name: 'Outros contatos' });
    await expect(extras).toBeHidden();
    await dialogo.locator('summary').filter({ hasText: 'Outros contatos' }).click();
    await expect(extras.getByRole('listitem')).toHaveCount(3);
    const central = extras.getByRole('listitem').filter({ hasText: '0800 123 4567' });
    await expect(central.getByRole('link', { name: 'WhatsApp' })).toHaveCount(0);
    await expect(central.getByRole('link', { name: 'Ligar' })).toHaveAttribute(
      'href',
      'tel:08001234567',
    );
    await expect(
      extras.getByText('relacionamento.corporativo@clinica-modelo-de-atendimento.example.com', {
        exact: true,
      }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const a11y = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(a11y.violations).toEqual([]);
  });

  test('mantém o foco no modal e ignora os contatos recolhidos', async ({ page }) => {
    await page.goto('/preview/prospeccao');
    await page.getByRole('button', { name: 'Ver detalhes' }).first().click();
    const dialogo = page.getByRole('dialog');
    const fechar = dialogo.getByRole('button', { name: 'Fechar detalhes da empresa' });
    const criar = dialogo.getByRole('button', { name: 'Criar oportunidade' });
    await expect(fechar).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(criar).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(fechar).toBeFocused();
    const resumo = dialogo.locator('summary').filter({ hasText: 'Outros contatos' });
    await resumo.focus();
    await page.keyboard.press('Enter');
    await expect(resumo.locator('..')).toHaveAttribute('open');
    await page.keyboard.press('Tab');
    await expect(dialogo.getByRole('button', { name: 'Copiar (31) 98888-1010' })).toBeFocused();
  });

  test('modal legível em tela estreita e baixa, inclusive sem contatos', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop',
      'Matriz de geometria no Chromium; fluxos acima cobrem todos os motores.',
    );
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 900, height: 500 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/preview/prospeccao?cartoes=1');
      await page.getByRole('button', { name: 'Ver detalhes' }).last().click();
      const dialogo = page.getByRole('dialog');
      await expect(dialogo.getByRole('button', { name: 'Criar oportunidade' })).toBeInViewport();
      const geometria = await dialogo.evaluate((el) => ({
        width: el.scrollWidth,
        client: el.clientWidth,
        bottom: el.getBoundingClientRect().bottom,
        targets: [...el.querySelectorAll('a, button, summary')]
          .filter((target) => target.checkVisibility())
          .map((target) => ({
            height: target.getBoundingClientRect().height,
            label: target.textContent || target.getAttribute('aria-label'),
          })),
      }));
      expect(geometria.width).toBeLessThanOrEqual(geometria.client);
      expect(geometria.bottom).toBeLessThanOrEqual(viewport.height);
      for (const target of geometria.targets)
        expect(target.height, target.label ?? '').toBeGreaterThanOrEqual(44);
      await page.keyboard.press('Escape');
    }
    await page
      .getByRole('listitem', { name: 'Empresa sem contato' })
      .getByRole('button', { name: 'Ver detalhes' })
      .click();
    await expect(page.getByRole('dialog').getByText('Nenhum contato disponível')).toBeVisible();
  });
});

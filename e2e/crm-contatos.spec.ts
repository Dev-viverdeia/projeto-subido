import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Contatos da ficha', () => {
  test('cadastro acessível sem pesquisa, alternativas e pessoas sob demanda', async ({ page }) => {
    await page.goto('/preview/crm-dossie?pesquisa=pendente');
    const contatos = page.getByRole('region', { name: 'Contatos', exact: true });
    await expect(contatos.getByText('camila@clinicaaurora.com.br', { exact: true })).toBeVisible();
    await expect(contatos.getByRole('link', { name: 'Ligar', exact: true })).toHaveAttribute(
      'href',
      'tel:+5511999990000',
    );
    await expect(contatos.getByRole('link', { name: 'WhatsApp', exact: true })).toHaveAttribute(
      'href',
      'https://wa.me/5511999990000',
    );
    await expect(contatos.getByText('Disponibilidade no WhatsApp não verificada.')).toBeVisible();
    await expect(contatos.getByText('Diretora de Operações')).toBeHidden();
    await contatos.locator('summary').filter({ hasText: 'Pessoas envolvidas' }).click();
    await expect(contatos.getByText('Diretora de Operações')).toBeVisible();
    await expect(contatos.getByText('Contato confirmado')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Criar proposta', exact: true })).toBeVisible();
  });

  test('legado não volta, fontes correspondem ao contato e só há uma seção', async ({ page }) => {
    await page.goto('/preview/crm-dossie?contatos=legado');
    const contatos = page.getByRole('region', { name: 'Contatos', exact: true });
    await expect(contatos.getByText('(48) 3028-9989', { exact: true }).first()).toBeVisible();
    await expect(contatos.getByText(/coleta antiga/)).toBeVisible();
    await expect(
      contatos.getByText('atendimento@clinicaaurora.com.br', { exact: true }).first(),
    ).toBeHidden();
    const outros = contatos.locator('summary').filter({ hasText: 'Outros canais' });
    await outros.focus();
    await page.keyboard.press('Enter');
    await expect(contatos.getByRole('link', { name: 'Escrever', exact: true })).toHaveCount(2);
    await expect(contatos.getByText('(18) 4789-4818')).toHaveCount(0);
    await contatos.locator('summary').filter({ hasText: 'Fontes dos contatos' }).click();
    await expect(contatos.getByRole('link', { name: 'Google Maps' })).toHaveAttribute(
      'href',
      'https://maps.google.com/?cid=1',
    );
    await page.getByRole('tab', { name: 'Dados e fontes' }).click();
    await expect(page.getByRole('region', { name: 'Contatos', exact: true })).toHaveCount(1);
    await expect(page.getByRole('tabpanel').getByRole('link', { name: 'Ligar' })).toHaveCount(0);
  });

  test('sem canais não cria ações falsas', async ({ page }) => {
    await page.goto('/preview/crm-dossie?pesquisa=pendente&contatos=vazio');
    const contatos = page.getByRole('region', { name: 'Contatos', exact: true });
    await expect(contatos.getByText('Nenhum contato disponível')).toBeVisible();
    await expect(contatos.getByRole('link')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Enriquecer dados' })).toBeVisible();
  });

  test('legibilidade, alvos e teclado no desktop e celular', async ({ page }) => {
    await page.goto('/preview/crm-dossie?contatos=longo');
    const contatos = page.getByRole('region', { name: 'Contatos', exact: true });
    await contatos.scrollIntoViewIfNeeded();
    const copiar = contatos.getByRole('button', { name: /Copiar \(48\)/ }).first();
    await copiar.focus();
    await page.keyboard.press('Tab');
    await expect(
      contatos.getByRole('link', { name: 'WhatsApp', exact: true }).first(),
    ).toBeFocused();
    expect(
      await contatos.evaluate((elemento) => {
        const controles = [...elemento.querySelectorAll<HTMLElement>('a, button, summary')].filter(
          (item) => item.checkVisibility(),
        );
        return controles.every((item) => {
          const caixa = item.getBoundingClientRect();
          return caixa.width >= 44 && caixa.height >= 44;
        });
      }),
    ).toBe(true);
    expect(
      await contatos
        .locator('strong')
        .first()
        .evaluate((item) => parseFloat(getComputedStyle(item).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    const analise = await new AxeBuilder({ page })
      .include('section[aria-labelledby="contatos-ficha-titulo"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(analise.violations).toEqual([]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await contatos.locator('summary').filter({ hasText: 'Outros canais' }).click();
    await expect(
      contatos.getByText('atendimento@clinicaaurora.com.br', { exact: true }).first(),
    ).toBeVisible();
  });
});

import { expect, type Page } from '@playwright/test';

// Exercita os controles visíveis: no celular as listas ficam recolhidas e a fase é um select.
export async function escolherFase(page: Page, titulo: string) {
  const implementar = page.getByRole('tab', { name: 'Implementar', exact: true });
  if ((await implementar.getAttribute('aria-selected')) !== 'true') await implementar.click();
  const seletor = page.getByRole('combobox', { name: 'Escolher fase do projeto' });
  if (await seletor.isVisible()) {
    const valor = await seletor
      .getByRole('option', { name: new RegExp(titulo) })
      .getAttribute('value');
    expect(valor).not.toBeNull();
    await seletor.selectOption(valor!);
    await expect(seletor).toHaveValue(valor!);
  } else {
    await page
      .getByRole('navigation', { name: 'Fases do projeto' })
      .getByRole('button', { name: new RegExp(titulo) })
      .click();
    await expect(page.getByRole('heading', { level: 2, name: titulo, exact: true })).toBeVisible();
  }
}

export async function escolherPasso(page: Page, fase: string, nome: string | RegExp) {
  const lista = page.getByRole('navigation', { name: `Passos da fase ${fase}` });
  if (!(await lista.isVisible())) {
    await page.getByRole('button', { name: /^Passo \d+ de \d+ Ver passos/ }).click();
  }
  await expect(lista).toBeVisible();
  await lista.getByRole('button', { name: nome }).click();
}

export async function escolherAula(page: Page, nome: string | RegExp) {
  const aprender = page.getByRole('tab', { name: 'Aprender', exact: true });
  if ((await aprender.getAttribute('aria-selected')) !== 'true') await aprender.click();
  const lista = page.getByRole('navigation', { name: 'Aulas do projeto' });
  if (!(await lista.isVisible())) {
    await page.getByRole('button', { name: /^Aula \d+ de \d+ Ver aulas/ }).click();
  }
  await expect(lista).toBeVisible();
  await lista.getByRole('button', { name: nome }).click();
}

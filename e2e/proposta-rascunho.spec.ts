import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const url = '/preview/proposta-editor?estado=rascunho';
const prefixo = 'subido:proposta:rascunho:v1:';
const copias = (page: Page) =>
  page.evaluate(
    (prefixo) => Object.keys(localStorage).filter((k) => k.startsWith(prefixo)),
    prefixo,
  );
const abrir = async (page: Page) => {
  await page.goto(url);
  await expect(page.getByLabel('Nome da proposta')).toBeEditable();
};
const revisar = async (page: Page) => {
  await page.getByRole('button', { name: 'Revisar rascunho' }).click();
  return page.getByRole('dialog', { name: 'Recuperar edição' });
};

test('reload oferece recuperação sem alterar a versão salva nem enviar; modal acessível', async ({
  page,
  isMobile,
}, testInfo) => {
  const escritas: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') escritas.push(r.url());
  });
  await abrir(page);
  const original = await page.getByLabel('Nome da proposta').inputValue();
  await page.getByLabel('Nome da proposta').fill('Proposta revisada antes de fechar');
  await expect.poll(() => copias(page)).toHaveLength(1);
  await page.reload();
  await expect(page.getByLabel('Nome da proposta')).toHaveValue(original);
  const modal = await revisar(page);
  await expect(modal.getByText('Proposta revisada antes de fechar', { exact: true })).toBeVisible();
  await expect(modal.locator('details')).toHaveCount(1);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
    [],
  );
  await page.screenshot({ path: testInfo.outputPath('recuperar.png') });
  await modal.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Revisar rascunho' })).toBeFocused();
  await revisar(page);
  await modal.getByRole('button', { name: 'Recuperar nos campos' }).click();
  await expect(page.getByLabel('Nome da proposta')).toHaveValue(
    'Proposta revisada antes de fechar',
  );
  await expect(page.getByLabel('Nome da proposta')).toBeFocused();
  await expect(
    page.getByRole('button', { name: isMobile ? 'Salvar' : 'Salvar alterações', exact: true }),
  ).toBeEnabled();
  expect(escritas).toEqual([]);
});

test('fechar e abrir outra aba preserva campos incompletos e valor exato digitado', async ({
  page,
  context,
  isMobile,
}) => {
  await abrir(page);
  await page.getByRole('heading', { name: 'Cliente e objetivo', exact: true }).click();
  await page.getByLabel('Empresa', { exact: true }).fill('');
  await page.getByLabel('E-mail', { exact: true }).fill('camila@');
  await page.getByRole('heading', { name: 'Valor e condições', exact: true }).click();
  await page.getByLabel('Valor do projeto (R$)', { exact: true }).fill('17900,');
  // Navegar antes do debounce exercita o flush de desmontagem/pagehide.
  await page.goto('/preview/propostas');
  await page.close();
  const outra = await context.newPage();
  await abrir(outra);
  const modal = await revisar(outra);
  await modal.getByRole('button', { name: 'Recuperar nos campos' }).click();
  await outra.getByRole('heading', { name: 'Cliente e objetivo', exact: true }).click();
  await expect(outra.getByLabel('Empresa', { exact: true })).toHaveValue('');
  await expect(outra.getByLabel('E-mail', { exact: true })).toHaveValue('camila@');
  await outra.getByRole('heading', { name: 'Valor e condições', exact: true }).click();
  await expect(outra.getByLabel('Valor do projeto (R$)', { exact: true })).toHaveValue('17900,');
  if (isMobile) await outra.getByRole('button', { name: 'Ver prévia', exact: true }).click();
  await expect(
    outra.getByLabel('Prévia visual da proposta').getByText('R$ 17.900,00', { exact: true }),
  ).toBeVisible();
});

test('rascunho baseado em outra versão exige revisão antes de sobrescrever', async ({
  page,
  isMobile,
}) => {
  await abrir(page);
  await page.getByLabel('Nome da proposta').fill('Cópia antiga a recuperar');
  await expect.poll(() => copias(page)).toHaveLength(1);
  const outra = await page.context().newPage();
  await page.evaluate((prefixo) => {
    const key = Object.keys(localStorage).find((k) => k.startsWith(prefixo))!;
    const r = JSON.parse(localStorage.getItem(key)!);
    r.base.versao = 1;
    r.base.titulo = 'Base anterior a esta proposta';
    localStorage.setItem(key, JSON.stringify(r));
  }, prefixo);
  await abrir(outra);
  const modal = await revisar(outra);
  await modal.getByRole('button', { name: 'Recuperar nos campos' }).click();
  await expect(outra.getByLabel('Nome da proposta')).toHaveValue('Cópia antiga a recuperar');
  await expect(
    outra.getByRole('button', { name: isMobile ? 'Salvar' : 'Salvar alterações', exact: true }),
  ).toBeDisabled();
  await outra.getByRole('button', { name: 'Revisar alteração' }).click();
  await expect(
    outra
      .getByRole('dialog')
      .getByText('Automação do atendimento da Clínica Aurora', { exact: true }),
  ).toBeVisible();
});

test('descartar pede revisão e remove apenas a cópia escolhida em 320 px', async ({
  page,
  isMobile,
}) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 740 });
  await abrir(page);
  const original = await page.getByLabel('Nome da proposta').inputValue();
  await page.getByLabel('Nome da proposta').fill('Rascunho a descartar');
  await page.reload();
  const modal = await revisar(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await modal.getByRole('button', { name: 'Descartar esta cópia' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Nome da proposta')).toHaveValue(original);
  await expect.poll(() => copias(page)).toHaveLength(0);
});

test('duas abas guardam edições separadas e uma cópia recuperada não apaga a outra', async ({
  page,
  context,
}) => {
  await abrir(page);
  await page.getByLabel('Nome da proposta').fill('Texto da primeira aba');
  await expect.poll(() => copias(page)).toHaveLength(1);
  const outra = await context.newPage();
  await abrir(outra);
  await outra.getByLabel('Nome da proposta').fill('Texto da segunda aba');
  await expect.poll(() => copias(outra)).toHaveLength(2);
  const terceira = await context.newPage();
  await abrir(terceira);
  const modal = await revisar(terceira);
  await expect(modal.getByLabel('Cópia para revisar').locator('option')).toHaveCount(2);
  await modal.getByRole('button', { name: 'Recuperar nos campos' }).click();
  await expect(terceira.getByLabel('Nome da proposta')).toHaveValue('Texto da segunda aba');
  await expect.poll(() => copias(terceira)).toHaveLength(2);
});

test('sem armazenamento a mensagem não promete que a edição foi guardada', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error('storage indisponível');
    };
  });
  await abrir(page);
  await page.getByLabel('Nome da proposta').fill('Edição apenas nos campos');
  await expect(page.getByText('A cópia neste navegador não foi guardada')).toBeVisible();
  await expect(page.getByLabel('Nome da proposta')).toHaveValue('Edição apenas nos campos');
  await expect(page.getByRole('button', { name: 'Revisar rascunho' })).toHaveCount(0);
});

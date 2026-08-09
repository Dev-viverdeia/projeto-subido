import { expect, test } from '@playwright/test';
import { CST } from '../src/lib/brand';

const TELAS = [
  ['/', 'As empresas já'],
  ['/entrar', 'Entrar'],
  ['/preview/mapa-jornada', 'Dê três coordenadas'],
  ['/preview/crm', 'CRM conectado aos fatos'],
  ['/preview/calls', 'Calls que alimentam o trabalho'],
  ['/preview/crm-dossie', 'O que aconteceu e o que vem agora'],
  ['/preview/pos-call', 'Confirme o próximo movimento'],
  ['/preview/propostas', 'Do diagnóstico à decisão'],
  ['/preview/sala-entrega', 'O combinado segue com o cliente'],
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
    await expect(page.getByRole('img', { name: 'Viver de IA Subido' })).toBeVisible();
  });

  test('a Sala mantém todo o plano alcançável na rolagem', async ({ page }) => {
    await page.goto('/preview/sala-entrega');
    const compromissoConcluido = page.getByRole('button', { name: 'Reabrir' });
    await compromissoConcluido.scrollIntoViewIfNeeded();
    await expect(compromissoConcluido).toBeVisible();

    const alturas = await page.evaluate(() => ({
      documento: document.documentElement.scrollHeight,
      corpo: document.body.scrollHeight,
    }));
    expect(Math.abs(alturas.documento - alturas.corpo)).toBeLessThanOrEqual(2);
  });
});

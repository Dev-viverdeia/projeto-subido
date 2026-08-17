import { expect, test } from '@playwright/test';
import { CST } from '../src/lib/brand';

const TELAS = [
  ['/', 'As empresas já'],
  ['/entrar', 'Entrar'],
  ['/preview/mapa-jornada', 'Defina o foco da sua primeira oferta'],
  ['/preview/crm', 'Três etapas de trabalho para saber quem precisa de atenção agora'],
  ['/preview/prospeccao', 'Encontre empresas. Escolha quais viram oportunidade'],
  ['/preview/calls', 'Cada reunião vira contexto no CRM'],
  ['/preview/sala-call', 'Descoberta do atendimento da Clínica Rios'],
  ['/preview/live-coach', 'Dimensione o custo da espera'],
  ['/preview/crm-dossie', 'Clínica Aurora'],
  ['/preview/pos-call', 'Descoberta do atendimento da Clínica Horizonte'],
  ['/preview/propostas', 'Da descoberta à decisão'],
  ['/preview/proposta-editor', 'Proposta pronta para decisão'],
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
    await expect(page.getByRole('img', { name: 'Subido' })).toBeVisible();
  });

  test('a Início distingue a meta futura do próximo fato a comprovar', async ({ page }) => {
    await page.goto('/preview/mapa-jornada?estado=evolucao');

    await expect(page.getByText('Meta da etapa · Segundo ciclo comprovado')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Confirmar o segundo projeto' })).toBeVisible();
    await expect(page.getByText('Segundo projeto ainda não confirmado.')).toBeVisible();
  });

  test('a Sala mantém todo o plano alcançável na rolagem', async ({ page }) => {
    await page.goto('/preview/sala-entrega');
    const compromissoConcluido = page.getByRole('button', {
      name: 'Reabrir tarefa',
      exact: true,
    });
    await compromissoConcluido.scrollIntoViewIfNeeded();
    await expect(compromissoConcluido).toBeVisible();

    const alturas = await page.evaluate(() => ({
      documento: document.documentElement.scrollHeight,
      corpo: document.body.scrollHeight,
    }));
    expect(Math.abs(alturas.documento - alturas.corpo)).toBeLessThanOrEqual(2);
  });

  test('o pós-call preserva áudio e transcrição como fontes privadas', async ({ page }) => {
    await page.goto('/preview/pos-call');

    await expect(page.getByRole('heading', { name: 'Gravação privada da reunião' })).toBeVisible();
    await expect(page.getByText('Somente sua conta')).toBeVisible();
    await expect(page.getByText('Transcrição da reunião')).toBeVisible();
  });
});

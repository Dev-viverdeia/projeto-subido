import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Resultados de Prospecção legíveis', () => {
  test('mostra contatos completos e ações acessíveis, inclusive com dados parciais', async ({
    page,
  }) => {
    await page.goto('/preview/prospeccao?cartoes=1');
    const resultados = page.getByRole('list', { name: 'Empresas encontradas' });
    const aurora = resultados.getByRole('listitem', { name: 'Clínica Aurora', exact: true });
    await expect(
      aurora.getByRole('link', { name: 'Telefone / WhatsApp: (31) 3333-4444' }),
    ).toHaveAttribute('href', 'https://wa.me/553133334444');
    await expect(
      aurora.getByRole('link', { name: 'E-mail da empresa: contato@clinicaaurora.com.br' }),
    ).toHaveAttribute('href', 'mailto:contato@clinicaaurora.com.br');
    await expect(aurora.getByText('Projeto para validar')).toBeVisible();
    await expect(resultados.getByText('Responsável a identificar')).toHaveCount(0);
    await expect(resultados.getByText('Muitos dados encontrados')).toHaveCount(0);
    const existente = resultados.getByRole('listitem', { name: 'Odonto Savassi' });
    await expect(existente.getByRole('link', { name: 'Abrir ficha' })).toHaveAttribute(
      'href',
      '/vendas/33333333-3333-4333-8333-333333333333',
    );
    await expect(existente.getByRole('button', { name: 'Criar oportunidade' })).toHaveCount(0);
    const vazio = resultados.getByRole('listitem', { name: 'Empresa sem contato' });
    await expect(vazio.getByText('Contato ainda não encontrado')).toBeVisible();
    await expect(vazio.getByRole('link')).toHaveCount(0);
    await expect(
      resultados.getByRole('link', { name: 'Facebook: @empresa-ficticia' }),
    ).toHaveAttribute('href', 'https://facebook.com/empresa-ficticia');

    const controles = await resultados.locator('a, button').evaluateAll((elementos) =>
      elementos.map((elemento) => {
        const rect = elemento.getBoundingClientRect();
        return { texto: elemento.textContent, largura: rect.width, altura: rect.height };
      }),
    );
    for (const controle of controles) {
      expect(controle.altura, controle.texto ?? '').toBeGreaterThanOrEqual(44);
      expect(controle.largura, controle.texto ?? '').toBeGreaterThanOrEqual(44);
    }
    const axe = await new AxeBuilder({ page })
      .include('[aria-label="Empresas encontradas"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
  });

  test('acomoda nomes e e-mails longos sem corte ou rolagem lateral', async ({
    page,
  }, testInfo) => {
    await page.goto('/preview/prospeccao?cartoes=1');
    const larguras = testInfo.project.name === 'mobile' ? [390, 320] : [1440, 1280, 900];
    for (const largura of larguras) {
      await page.setViewportSize({ width: largura, height: 900 });
      const resultados = page.getByRole('list', { name: 'Empresas encontradas' });
      const email = resultados.getByRole('link', { name: /relacionamento.corporativo@/ });
      await email.scrollIntoViewIfNeeded();
      const medidas = await resultados.evaluate((elemento) => {
        const itens = [...elemento.querySelectorAll<HTMLElement>('h3, a, a span, button')];
        return {
          estouro: document.documentElement.scrollWidth > innerWidth + 1,
          cortes: itens
            .filter(
              (item) =>
                item.scrollWidth > item.clientWidth + 1 ||
                item.scrollHeight > item.clientHeight + 1,
            )
            .map((item) => item.textContent),
          contatos: [...elemento.querySelectorAll('a[href^="mailto:"]')].map((item) => {
            const texto = item.querySelector('small + span')!;
            const css = getComputedStyle(texto);
            return {
              tamanho: parseFloat(css.fontSize),
              reticencias: css.textOverflow,
              largura: texto.getBoundingClientRect().width,
            };
          }),
        };
      });
      expect(medidas.estouro, `largura ${largura}`).toBe(false);
      expect(medidas.cortes, `largura ${largura}`).toEqual([]);
      for (const contato of medidas.contatos) {
        expect(contato.tamanho).toBeGreaterThanOrEqual(16);
        expect(contato.reticencias).not.toBe('ellipsis');
        expect(contato.largura).toBeGreaterThan(100);
      }
    }
  });

  test('abre detalhes pelo teclado e devolve o foco sem movimento obrigatório', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/preview/prospeccao?cartoes=1');
    const card = page.getByRole('listitem', { name: 'Empresa sem contato' });
    const detalhes = card.getByRole('button', { name: 'Ver detalhes' });
    await detalhes.focus();
    await expect(detalhes).toBeFocused();
    expect(await detalhes.evaluate((elemento) => getComputedStyle(elemento).boxShadow)).not.toBe(
      'none',
    );
    // O reset global do DS usa 0.01 ms em vez de zero para preservar eventos de término.
    expect(
      await card.evaluate((elemento) => parseFloat(getComputedStyle(elemento).transitionDuration)),
    ).toBeLessThanOrEqual(0.00001);
    await page.keyboard.press('Enter');
    const modal = page.getByRole('dialog', { name: 'Empresa sem contato' });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Fechar detalhes da empresa' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(detalhes).toBeFocused();
  });
});

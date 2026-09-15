import { expect, test } from '@playwright/test';

test.describe('Quadro de vendas', () => {
  test('separa ganho e perda e preserva o motivo no card', async ({ page }, testInfo) => {
    // Quatro colunas cabem no desktop largo; notebooks usam as mesmas abas do quadro compacto.
    if (testInfo.project.name !== 'mobile')
      await page.setViewportSize({ width: 1920, height: 1080 });
    const erros: string[] = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    await page.goto('/preview/crm');

    await expect(page.getByRole('heading', { name: 'Preparar' })).toBeVisible();
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('tab', { name: 'Descobrir: 1' }).click();
      await expect(page.getByRole('heading', { name: 'Descobrir' })).toBeVisible();
      await page.getByRole('tab', { name: 'Propor: 1' }).click();
      await expect(page.getByRole('heading', { name: 'Propor' })).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Descobrir' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Propor' })).toBeVisible();
    }
    if (testInfo.project.name === 'mobile')
      await page.getByRole('tab', { name: /^Ganho:/ }).click();
    await expect(page.getByRole('heading', { name: 'Ganho', exact: true })).toBeVisible();
    await page.getByText('Fora do fluxo', { exact: true }).click();
    await expect(page.getByText('Momento inadequado', { exact: true })).toBeVisible();
    await expect(page.getByText('Fechados', { exact: true })).toHaveCount(0);
    expect(erros).toEqual([]);
  });

  test('o card inteiro move a venda e a perda exige contexto', async ({ page }, testInfo) => {
    if (testInfo.project.name !== 'mobile') {
      await page.setViewportSize({ width: 1920, height: 1080 });
    }
    await page.goto('/preview/crm');

    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Ações de Clínica Aurora', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Marcar como perdida' }).click();
    } else {
      const card = page.getByRole('group', {
        name: /Automação do atendimento, Clínica Aurora\. Arraste/,
      });
      const origem = await card.boundingBox();
      expect(origem).not.toBeNull();
      if (!origem) return;

      await page.mouse.move(origem.x + origem.width * 0.46, origem.y + origem.height * 0.46);
      await page.mouse.down();
      await page.mouse.move(origem.x + 18, origem.y + 18, { steps: 4 });
      const destino = page.getByRole('group', { name: 'Marcar venda como perdida' });
      await expect(destino).toBeVisible();
      const chegada = await destino.boundingBox();
      expect(chegada).not.toBeNull();
      if (!chegada) return;
      await page.mouse.move(chegada.x + chegada.width / 2, chegada.y + chegada.height / 2, {
        steps: 16,
      });
      await page.mouse.up();
      // O dnd-kit mantém seu bloqueio de cliques por 50 ms após o drop.
      // Aguarde a lib liberar os eventos antes de simular a próxima ação humana.
      await page.waitForTimeout(60);
    }

    const dialogo = page.getByRole('dialog', { name: 'Registrar venda perdida' });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Registrar como perdida' }).click();
    await expect(dialogo.getByText('Escolha o motivo para concluir o registro.')).toBeVisible();
    await dialogo.getByText('Não é prioridade agora', { exact: true }).click();
    await expect(dialogo.getByRole('radio', { name: 'Não é prioridade agora' })).toBeChecked();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialogo).toBeHidden();
  });
});

test.describe('Retomar o trabalho no quadro', () => {
  for (const retorno of ['link', 'navegador'] as const) {
    test(`preserva busca, filtro, etapa, posição e foco ao voltar pelo ${retorno}`, async ({
      page,
      isMobile,
      browserName,
    }) => {
      await page.goto('/preview/crm?volume=1');
      await page.getByRole('searchbox', { name: 'Buscar vendas' }).fill('Orbe');
      await page.getByRole('button', { name: 'Com proposta: 26', exact: true }).click();
      const link = page.getByRole('link', { name: 'Orbe Contabilidade 21', exact: true });
      // Simular a leitura do card, fora da barra fixa e das bordas do viewport.
      await link.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      let antes: number | null = null;
      await page.exposeFunction('registrarTopoSaida', (topo: number) => {
        antes = topo;
      });
      // WebKit pode reposicionar o alvo ao clicar. Observar o DOM no clique real,
      // sem ler o storage ou reutilizar a posição calculada pela implementação.
      await link.evaluate((el) => {
        el.addEventListener(
          'click',
          () => {
            void (
              window as Window & { registrarTopoSaida: (topo: number) => Promise<void> }
            ).registrarTopoSaida(el.closest('[data-venda-id]')!.getBoundingClientRect().top);
          },
          { once: true, capture: true },
        );
      });
      await link.click();
      await expect.poll(() => antes).not.toBeNull();
      await expect(
        page.getByRole('heading', { name: 'Ficha do cliente', exact: true }),
      ).toBeVisible();
      if (retorno === 'link') await page.getByRole('link', { name: 'Voltar para Vendas' }).click();
      else await page.goBack();
      await expect(page.getByRole('searchbox')).toHaveValue('Orbe');
      await expect(
        page.getByRole('button', { name: 'Com proposta: 26', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      if (isMobile)
        await expect(page.getByRole('tab', { name: 'Propor: 13' })).toHaveAttribute(
          'aria-selected',
          'true',
        );
      await expect(link).toBeFocused();
      await expect(link).toBeInViewport();
      // O hover existente levanta o card 2px; o retorno não precisa reproduzir o hover.
      await expect
        .poll(async () =>
          Math.abs(
            (await link.evaluate(
              (el) => el.closest('[data-venda-id]')!.getBoundingClientRect().top,
            )) - antes!,
          ),
        )
        .toBeLessThan(4);
      // Safari usa Option+Tab para percorrer todos os controles, incluindo botões.
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(
        page.getByRole('button', { name: 'Ações de Orbe Contabilidade 21', exact: true }),
      ).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.reload();
      await expect(page.getByRole('searchbox')).toHaveValue('Orbe');
      await expect(
        page.getByRole('button', { name: 'Com proposta: 26', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
  }

  test('histórico permanece aberto e retorna ao mesmo registro', async ({ page }) => {
    await page.goto('/preview/crm?volume=1');
    await page.getByText('Fora do fluxo', { exact: true }).click();
    const historico = page.locator('details').filter({ hasText: 'Fora do fluxo' });
    const link = historico.getByRole('link', { name: 'Abrir ficha', exact: true });
    await link.click();
    await expect(page.getByRole('heading', { name: 'Ficha do cliente' })).toBeVisible();
    await page.getByRole('link', { name: 'Voltar para Vendas' }).click();
    await expect(historico).toHaveAttribute('open', '');
    await expect(link).toBeFocused();
    await expect(link).toBeInViewport();
  });

  test('venda removida não deixa a pessoa perdida em uma lista vazia', async ({ page }) => {
    await page.goto('/preview/crm?volume=1');
    await page.getByRole('searchbox').fill('Orbe Contabilidade 21');
    await page.getByRole('link', { name: 'Orbe Contabilidade 21', exact: true }).click();
    await page.getByRole('link', { name: 'Simular venda removida' }).click();
    await expect(page.getByText('Nenhuma venda encontrada')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Todas: 39', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(page.getByRole('searchbox')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Todas: 39', exact: true })).toBeFocused();
    await expect(page.getByRole('link', { name: 'Orbe Contabilidade', exact: true })).toBeVisible();
  });

  test('continua funcionando com armazenamento bloqueado', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error('Bloqueado no teste');
        },
      });
    });
    await page.goto('/preview/crm?volume=1');
    await page.getByRole('searchbox').fill('Orbe');
    await page.getByRole('link', { name: 'Orbe Contabilidade 21', exact: true }).click();
    await page.getByRole('link', { name: 'Voltar para Vendas' }).click();
    await expect(page.getByRole('searchbox')).toHaveValue('Orbe');
    await expect(
      page.getByRole('link', { name: 'Orbe Contabilidade 21', exact: true }),
    ).toBeFocused();
  });
});

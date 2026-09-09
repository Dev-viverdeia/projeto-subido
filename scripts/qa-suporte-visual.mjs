// Validação visual autenticada. Não chama RPC de envio nem gera notificações.
import { randomUUID } from 'node:crypto';
import { criarHarness, exigir, expect } from './qa-suporte-harness.mjs';

const destino = process.env.SUBIDO_APP_URL || 'http://127.0.0.1:3012';
if (!['127.0.0.1', 'localhost'].includes(new URL(destino).hostname))
  throw new Error('Esta inspeção usa apenas a aplicação local.');
const h = await criarHarness();
try {
  const cliente = await h.conta('visual');
  const agente = await h.conta('visual-equipe', true);
  const id = randomUUID();
  h.casos.push(id);
  exigir(
    await h.admin.from('suporte_atendimentos').insert({
      id,
      dono: cliente.user.id,
      email: cliente.user.email,
      assunto: 'QA visual: ajuda para conectar minha agenda',
      categoria: 'reunioes',
      status: 'aguardando_voce',
    }),
  );
  const agora = Date.now();
  exigir(
    await h.admin.from('suporte_mensagens').insert([
      {
        atendimento: id,
        autor: cliente.user.id,
        papel: 'usuario',
        interna: false,
        criado_em: new Date(agora - 120_000).toISOString(),
        texto: 'Escolhi minha conta no Google, mas a agenda ainda não aparece conectada.',
      },
      {
        atendimento: id,
        autor: agente.user.id,
        papel: 'equipe',
        interna: false,
        criado_em: new Date(agora - 60_000).toISOString(),
        texto:
          'Vamos conferir juntos. Ao voltar do Google, apareceu algum aviso na seção de agenda da sua conta?',
      },
      {
        atendimento: id,
        autor: agente.user.id,
        papel: 'equipe',
        interna: true,
        criado_em: new Date(agora).toISOString(),
        texto: 'NOTA PRIVADA QA VISUAL: não deve aparecer para o cliente.',
      },
    ]),
  );
  for (const [rota, nome] of [
    ['/suporte', 'central'],
    ['/suporte/novo', 'pedido'],
    ['/suporte/ia', 'ia'],
    [`/suporte/${id}`, 'conversa'],
  ]) {
    await cliente.page.goto(`${h.app}${rota}`);
    await expect(cliente.page.getByRole('heading', { level: 1 })).toBeVisible();
    await h.visual(cliente.page, nome);
  }
  await expect(cliente.page.getByText(/NOTA PRIVADA QA VISUAL/)).toHaveCount(0);
  await cliente.page.getByRole('button', { name: 'Responder', exact: true }).click();
  await expect(cliente.page.getByLabel('Sua mensagem', { exact: true })).toBeFocused();
  await agente.page.goto(`${h.app}/suporte/equipe?busca=QA+visual&status=`);
  await expect(agente.page.getByRole('heading', { name: 'Painel de suporte' })).toBeVisible();
  await h.visual(agente.page, 'fila');
  await agente.page.goto(`${h.app}/suporte/equipe/${id}`);
  await expect(agente.page.getByText(/NOTA PRIVADA QA VISUAL/)).toBeVisible();
  await h.visual(agente.page, 'equipe');
  exigir(await h.admin.from('suporte_atendimentos').update({ status: 'resolvido' }).eq('id', id));
  await cliente.page.reload();
  await expect(cliente.page.getByRole('heading', { name: 'Atendimento resolvido' })).toBeVisible();
  await h.visual(cliente.page, 'resolvido');
  expect(
    exigir(await h.admin.from('suporte_notificacoes').select('id').eq('atendimento', id)),
  ).toHaveLength(0);
  console.log(
    'Suporte autenticado: cliente, equipe, nota privada, resolução, desktop/mobile e axe OK. Zero notificações. Capturas:',
    h.pasta,
  );
} finally {
  await h.limpar();
  console.log('Contas e atendimento temporários removidos.');
}

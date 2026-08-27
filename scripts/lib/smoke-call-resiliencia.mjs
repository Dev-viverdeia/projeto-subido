export async function validarResilienciaAoVivo({
  simularReconexao,
  duracaoSegundos,
  contextoHost,
  paginaHost,
  eventos,
  esperar,
  etapa,
}) {
  if (simularReconexao) {
    const sessoesRealtimeAntes = eventos.filter((evento) =>
      evento.includes('/realtime:201'),
    ).length;
    await contextoHost.setOffline(true);
    await paginaHost
      .getByText('Sua internet caiu. A conversa continua assim que a conexão voltar.')
      .waitFor({ timeout: 15_000 });
    await paginaHost.waitForTimeout(4_000);
    await contextoHost.setOffline(false);
    await paginaHost.getByText('Escutando a conversa').waitFor({ timeout: 45_000 });
    await esperar({
      contexto: 'retomar transcrição depois da queda',
      limiteMs: 45_000,
      intervaloMs: 500,
      ler: async () => eventos.filter((evento) => evento.includes('/realtime:201')).length,
      pronto: (quantidade) => quantidade > sessoesRealtimeAntes,
    });
    await paginaHost.locator('.lk-video-conference').waitFor({ state: 'visible', timeout: 15_000 });
    etapa('reconexao_validada', {
      sessoesRealtime: eventos.filter((evento) => evento.includes('/realtime:201')).length,
    });
  }

  if (Number.isFinite(duracaoSegundos) && duracaoSegundos > 0) {
    await paginaHost.waitForTimeout(duracaoSegundos * 1_000);
    await paginaHost.locator('.lk-video-conference').waitFor({ state: 'visible', timeout: 15_000 });
    etapa('estabilidade_prolongada_validada', { duracaoSegundos });
  }
}

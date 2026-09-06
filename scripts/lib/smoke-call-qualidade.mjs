/** Verificações adicionais somente na conta descartável criada pelo smoke. */
export async function validarMidia({ page, esperar }) {
  return esperar({
    contexto: 'receber áudio e vídeo remoto sem reprodução duplicada',
    limiteMs: 30_000,
    intervaloMs: 500,
    ler: () =>
      page.evaluate(() => {
        const { document, MediaStream } = globalThis;
        const audios = [...document.querySelectorAll('audio')].filter(
          (item) =>
            item.srcObject instanceof MediaStream && item.srcObject.getAudioTracks().length > 0,
        );
        const ids = audios.flatMap((item) =>
          item.srcObject.getAudioTracks().map((track) => track.id),
        );
        return {
          videosRecebidos: [...document.querySelectorAll('video')].filter(
            (item) =>
              item.dataset.lkLocalParticipant === 'false' &&
              item.readyState >= 2 &&
              item.videoWidth > 0,
          ).length,
          audiosAtivos: audios.filter((item) => !item.paused && item.currentTime > 0).length,
          trilhas: ids.length,
          trilhasUnicas: new Set(ids).size,
        };
      }),
    pronto: (valor) =>
      valor.videosRecebidos > 0 && valor.audiosAtivos > 0 && valor.trilhas === valor.trilhasUnicas,
  });
}

export async function validarFicha({ paginaHost, admin, teste, resultado, erroSe, etapa }) {
  const participantes = await admin
    .from('calls_participantes')
    .select('papel,consentiu_gravacao_em')
    .eq('reuniao_id', teste.reuniao)
    .eq('dono', teste.usuario);
  erroSe(participantes.error, 'verificar consentimento');
  if (
    participantes.data.length !== 2 ||
    participantes.data.some((item) => !item.consentiu_gravacao_em)
  ) {
    throw new Error('O registro precisa ter consentimento dos dois participantes.');
  }
  const audio = paginaHost.locator('audio').first();
  await audio.evaluate(async (elemento) => {
    await elemento.play();
  });
  await paginaHost.waitForFunction(() => {
    const elemento = globalThis.document.querySelector('audio');
    return elemento && !elemento.paused && elemento.currentTime > 0.3 && elemento.readyState >= 2;
  });
  await audio.evaluate((elemento) => elemento.pause());
  etapa('gravacao_reproduzida', { consentimentos: 2 });

  const consulta = () =>
    admin
      .from('crm_oportunidades')
      .select('proxima_acao,etapa')
      .eq('id', teste.oportunidade)
      .eq('dono', teste.usuario)
      .single();
  const antes = await consulta();
  erroSe(antes.error, 'ler próxima ação antes da revisão');
  // Encerrar a reunião cria a tarefa de revisão; ainda não aplica o plano da IA.
  if (antes.data.proxima_acao !== 'Revisar resumo e próximos passos da call') {
    throw new Error('A ficha precisa pedir revisão antes de aplicar o plano da reunião.');
  }
  const acao = 'QA: revisar o roteiro de atendimento enviado pela gerente antes da proposta.';
  await paginaHost.getByLabel('Próxima ação da venda').fill(acao);
  await paginaHost.getByLabel('Próxima etapa da venda').selectOption('manter');
  await paginaHost.getByRole('button', { name: 'Confirmar e atualizar a venda' }).click();
  await paginaHost.getByText('Plano salvo na ficha do cliente.', { exact: true }).waitFor();
  const depois = await consulta();
  erroSe(depois.error, 'ler plano salvo');
  if (depois.data.proxima_acao !== acao || depois.data.etapa !== antes.data.etapa) {
    throw new Error('A ficha não preservou o plano confirmado pelo usuário.');
  }
  etapa('revisao_na_ficha_validada', {
    resumo: resultado.analise.resumo,
    proximosPassos: resultado.analise.proximos_passos,
    etapaPreservada: true,
  });
}

export async function validarRecepcao({ paginaHost, paginaConvidado, esperar, etapa }) {
  for (const [papel, page] of [
    ['host', paginaHost],
    ['convidado', paginaConvidado],
  ]) {
    etapa('midia_recebida', { papel, ...(await validarMidia({ page, esperar })) });
  }
  if (await paginaConvidado.getByRole('complementary', { name: 'Live Coach privado' }).count()) {
    throw new Error('O convidado não pode ver o coach privado.');
  }
  // Ambos recebem o mesmo WAV. Após provar os dois canais, deixe só uma voz
  // falando: duas cópias simultâneas tornam a transcrição artificialmente ilegível.
  await paginaConvidado.locator('button[data-lk-source="microphone"]').click();
  await paginaConvidado
    .locator('button[data-lk-source="microphone"][data-lk-enabled="false"]')
    .waitFor();
}

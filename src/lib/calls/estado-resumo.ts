import type { PosCall } from './queries';

export type OperacaoResumoCall = {
  tipo: string;
  status: string;
  tentativas: number;
  disponivelEm: string;
  bloqueadoAte: string | null;
  atualizadaEm: string;
};

type TipoEstado =
  | 'pronta'
  | 'fila'
  | 'processando'
  | 'retentativa'
  | 'demorada'
  | 'falhou'
  | 'sem_resumo'
  | 'sem_conteudo'
  | 'indisponivel'
  | 'desconhecido';

export type EstadoResumo = {
  tipo: TipoEstado;
  rotulo: string;
  titulo: string;
  apoio: string;
  acompanhar: boolean;
};

export type EntradaEstadoResumo = {
  reuniao: Pick<PosCall['reuniao'], 'status'>;
  analise: Pick<NonNullable<PosCall['analise']>, 'status' | 'resumo' | 'atualizadaEm'> | null;
  transcricao: { textoCompleto: string | null; segmentos: Array<{ texto: string }> } | null;
  operacoes: OperacaoResumoCall[] | null;
};

function estado(
  tipo: TipoEstado,
  rotulo: string,
  titulo: string,
  apoio: string,
  acompanhar = false,
): EstadoResumo {
  return { tipo, rotulo, titulo, apoio, acompanhar };
}

/** Ausência de registro não é processamento; null na fila significa leitura indisponível. */
export function estadoDoResumo(call: EntradaEstadoResumo, agora = Date.now()): EstadoResumo {
  const { analise, operacoes, reuniao, transcricao } = call;
  const temTexto = Boolean(
    transcricao?.textoCompleto?.trim() || transcricao?.segmentos.some((s) => s.texto.trim()),
  );
  const apoioManual = temTexto
    ? 'A transcrição está disponível abaixo. Você pode definir o próximo passo manualmente.'
    : 'Você pode definir o próximo passo manualmente, mesmo sem o resumo.';
  if (reuniao.status === 'cancelada')
    return estado('indisponivel', 'Reunião cancelada', 'Esta reunião foi cancelada.', apoioManual);
  if (analise?.status === 'concluida' && analise.resumo?.trim())
    return estado('pronta', 'Leitura pronta', 'Resumo disponível', 'Revise antes de aplicar.');
  if (analise?.status === 'sem_conteudo')
    return estado(
      'sem_conteudo',
      'Sem conteúdo suficiente',
      'Não houve conversa suficiente para resumir.',
      apoioManual,
    );
  if (operacoes === null)
    return estado(
      'desconhecido',
      'Status indisponível',
      'Não conseguimos consultar o andamento.',
      'Verifique novamente em instantes. Isso não inicia uma nova análise.',
    );

  const ativas = operacoes.filter((o) => ['pendente', 'processando'].includes(o.status));
  const vigente = ativas.find((o) => {
    const atualizacao = Date.parse(o.atualizadaEm);
    // Pequena diferença de relógio entre banco e servidor não indica uma fila parada.
    if (!Number.isFinite(atualizacao) || atualizacao > agora + 30_000) return false;
    return o.status === 'processando'
      ? Date.parse(o.bloqueadoAte ?? '') > agora && agora - atualizacao <= 7 * 60_000
      : Math.abs(agora - Date.parse(o.disponivelEm)) <= 5 * 60_000;
  });
  if (vigente) {
    if (vigente.status === 'pendente')
      return vigente.tentativas > 0
        ? estado(
            'retentativa',
            'Nova tentativa agendada',
            'Uma nova tentativa já está na fila.',
            'Não é preciso iniciar outra. Você pode sair desta página e voltar depois.',
            true,
          )
        : estado(
            'fila',
            'Na fila',
            'Aguardando o processamento.',
            'O pedido está registrado. Você pode sair desta página e voltar depois.',
            true,
          );
    return estado(
      'processando',
      'Em processamento',
      vigente.tipo === 'encerramento_sala'
        ? 'Finalizando a reunião.'
        : 'Preparando o resumo da conversa.',
      'Você pode sair desta página e voltar depois. O resumo aparecerá quando estiver pronto.',
      true,
    );
  }
  // Compatibilidade com análise iniciada antes da fila durável: reserva vence em 5 minutos.
  const idade = agora - Date.parse(analise?.atualizadaEm ?? '');
  if (
    analise?.status === 'processando' &&
    idade >= -30_000 &&
    idade < 5 * 60_000 &&
    !operacoes.length
  )
    return estado(
      'processando',
      'Em processamento',
      'Preparando o resumo da conversa.',
      'Você pode sair desta página e voltar depois.',
      true,
    );
  if (ativas.length || analise?.status === 'processando')
    return estado(
      'demorada',
      'Sem atualização recente',
      'O resumo está demorando mais que o esperado.',
      'Verifique o status ou peça ajuda. Nenhuma nova análise será iniciada por esse botão.',
    );
  if (analise?.status === 'falhou' || operacoes.some((o) => o.status === 'falhou'))
    return estado(
      'falhou',
      'Análise não concluída',
      'Não foi possível concluir o resumo.',
      apoioManual,
    );
  return estado(
    'sem_resumo',
    'Sem resumo',
    'Esta reunião ainda não tem resumo.',
    `Não há análise em andamento. ${apoioManual}`,
  );
}
